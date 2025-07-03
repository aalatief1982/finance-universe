import { useState, useCallback } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { findCategoryForVendor } from '@/services/CategoryInferencer';
import { useToast } from '@/components/ui/use-toast';
import { resetNERModel } from '@/ml/ner';
import { learningEngineService } from '@/services/LearningEngineService';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for handling the smart paste functionality.
 * Manages text processing, transaction detection, and various matching algorithms.
 * Supports multiple detection methods: template matching, structure matching, ML, and fallback.
 */
export const useSmartPaste = (
  onTransactionsDetected?: (
    transactions: Transaction[], 
    rawMessage?: string, 
    senderHint?: string, 
    confidence?: number, 
    shouldTrain?: boolean, 
    matchOrigin?: "template" | "structure" | "ml" | "fallback"
  ) => void,
  useHighAccuracy: boolean = false
) => {
  const [text, setText] = useState('');
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [isSmartMatch, setIsSmartMatch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [matchOrigin, setMatchOrigin] = useState<"template" | "structure" | "ml" | "fallback" | undefined>();
  const [currentSenderHint, setCurrentSenderHint] = useState<string | undefined>();
  const [structureMatch, setStructureMatch] = useState<any>(null);
  const navigate = useNavigate();

  console.log("[useSmartPaste] Hook initialized", { useHighAccuracy });

  /**
   * Handles pasting text from clipboard.
   * Retrieves clipboard text and initiates text processing.
   */
  const handlePaste = async () => {
    console.log("[useSmartPaste] Attempting to read from clipboard");
    try {
      const clipboardText = await navigator.clipboard.readText();
      console.log("[useSmartPaste] Text retrieved from clipboard, length:", clipboardText.length);
      setText(clipboardText);
      processText(clipboardText);
    } catch (err) {
      console.error("[useSmartPaste] Clipboard error:", err);
      toast({
        title: 'Clipboard Error',
        description: 'Could not read from clipboard.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Processes text to extract transaction information.
   * Tries multiple detection methods in order of reliability:
   * 1. Template matching
   * 2. Structure-based detection
   * 3. ML-based extraction
   * 4. Basic fallback extraction
   */
  const processText = async (rawText: string) => {
    console.log("[useSmartPaste] Starting text processing, text length:", rawText.length);
    if (!rawText.trim()) {
      console.log("[useSmartPaste] Empty text, processing aborted");
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Try LearningEngine template match
      console.log("[useSmartPaste] Step 1: Attempting template match");
      const match = learningEngineService.findBestMatch(rawText);
      console.log("[useSmartPaste] Template match result:", { matched: match.matched, confidence: match.confidence });
      
      if (match.matched && match.entry) {
        console.log("[useSmartPaste] Template match successful", { 
          senderHint: match.entry.senderHint,
          amount: match.entry.confirmedFields.amount,
          vendor: match.entry.confirmedFields.vendor
        });
        
        const { confirmedFields } = match.entry;
        const vendorName = confirmedFields.vendor || '';
        const categoryInfo = findCategoryForVendor(vendorName, confirmedFields.type || 'expense');

        const txn: Transaction = {
          id: `template-${Math.random().toString(36).substring(2, 9)}`,
          title: `Template: ${categoryInfo.category} | ${confirmedFields.amount}`,
          amount: confirmedFields.amount,
          currency: confirmedFields.currency,
          type: confirmedFields.type,
          fromAccount: confirmedFields.account || 'Unknown',
          category: confirmedFields.category || categoryInfo.category,
          subcategory: confirmedFields.subcategory || categoryInfo.subcategory,
          date: new Date().toISOString(),
          description: vendorName,
          notes: 'Extracted from template',
          source: 'smart-paste',
          person: confirmedFields.person
        };

        console.log("[useSmartPaste] Created transaction from template:", txn);
        setDetectedTransactions([txn]);
        setIsSmartMatch(true);
        setMatchOrigin("template");
        onTransactionsDetected?.([txn], rawText, match.entry.senderHint, match.confidence, false, "template");
        return;
      }

      // 2. Structure-based fallback
      console.log("[useSmartPaste] Step 2: Attempting structure match");
      const structureMatch = learningEngineService.matchUsingTemplateStructure(rawText);
      console.log("[useSmartPaste] Structure match result:", { 
        success: !!structureMatch, 
        confidence: structureMatch?.confidence 
      });
      
      setStructureMatch(structureMatch);
      
      if (structureMatch && structureMatch.inferredTransaction) {
        console.log("[useSmartPaste] Structure match successful", { 
          inference: structureMatch.inferredTransaction
        });
        
        const vendorName = structureMatch.inferredTransaction.description || '';
        const categoryInfo = findCategoryForVendor(vendorName, structureMatch.inferredTransaction.type || 'expense');

        const txn: Transaction = {
          id: `structure-${Math.random().toString(36).substring(2, 9)}`,
          title: `Structure: ${categoryInfo.category} | ${structureMatch.inferredTransaction.amount}`,
          amount: structureMatch.inferredTransaction.amount.toFixed(2),
          currency: structureMatch.inferredTransaction.currency || 'SAR',
          type: structureMatch.inferredTransaction.type || 'expense',
          fromAccount: structureMatch.inferredTransaction.fromAccount || 'Unknown',
          category: categoryInfo.category,
          subcategory: categoryInfo.subcategory,
          date: structureMatch.inferredTransaction.date || new Date().toISOString(),
          description: vendorName,
          notes: 'Matched by structure template',
          source: 'smart-paste'
        };

        console.log("[useSmartPaste] Created transaction from structure:", txn);
        setDetectedTransactions([txn]);
        setIsSmartMatch(true);
        setMatchOrigin("structure");
        onTransactionsDetected?.([txn], rawText, undefined, structureMatch.confidence, true, "structure");
        return;
      }

      // 3. ML fallback
      console.log("[useSmartPaste] Step 3: Attempting ML-based extraction", { useHighAccuracy });
      const parsed = await extractTransactionEntities(rawText, useHighAccuracy);
      console.log("[useSmartPaste] ML extraction result:", parsed);
      
      if (parsed.amount) {
        console.log("[useSmartPaste] ML extraction successful", {
          amount: parsed.amount,
          vendor: parsed.vendor,
          type: parsed.type
        });
        
        // Use the vendor property instead of description since that's what's available in the parsed output
        const categoryInfo = findCategoryForVendor(parsed.vendor || '', parsed.type || 'expense');
        const txn: Transaction = {
          id: `ml-${Math.random().toString(36).substring(2, 9)}`,
          title: `AI: ${categoryInfo.category} | ${parsed.amount}`,
          amount: parseFloat(String(parsed.amount)),  // Convert to number if it's a string
          currency: parsed.currency || 'SAR',
          type: (parsed.type as TransactionType) || 'expense',
          fromAccount: parsed.account || 'Unknown',
          category: categoryInfo.category,
          subcategory: categoryInfo.subcategory,
          date: parsed.date || new Date().toISOString(),
          description: parsed.vendor || '', // Use vendor as description
          notes: 'Extracted with ML',
          source: 'smart-paste'
        };

        console.log("[useSmartPaste] Created transaction from ML:", txn);
        setDetectedTransactions([txn]);
        setIsSmartMatch(true);
        setMatchOrigin("ml");
        onTransactionsDetected?.([txn], rawText, undefined, 0.65, true, "ml");
        return;
      }

      // 4. Final basic fallback
      console.log("[useSmartPaste] Step 4: Attempting basic fallback extraction");
      // Check if fallback confidence is low (< 0.4) for fallback
      const fallbackTxn = createFallbackTransaction(rawText);
      if (fallbackTxn) {
        console.log("[useSmartPaste] Fallback extraction created transaction:", fallbackTxn);
        setDetectedTransactions([fallbackTxn]);
        setIsSmartMatch(false);
        setMatchOrigin("fallback");
        
        // Check if confidence is low (< 0.4) for fallback
        const fallbackConfidence = 0.3;
        console.log("[useSmartPaste] Fallback confidence:", fallbackConfidence);
        
        // Redirect to Train Model page if confidence is low
        if (fallbackConfidence < 0.4) {
          console.log("[useSmartPaste] Low confidence, redirecting to Train Model page");
          navigate(`/train-model?msg=${encodeURIComponent(rawText)}&sender=${encodeURIComponent(currentSenderHint || '')}`);
          setIsProcessing(false);
          return;
        }
        
        onTransactionsDetected?.([fallbackTxn], rawText, undefined, fallbackConfidence, true, "fallback");
      } else {
        console.log("[useSmartPaste] No transaction could be detected");
        setDetectedTransactions([]);
        toast({ title: 'No transaction detected', description: 'Message could not be parsed.' });
      }

    } catch (error) {
      console.error("[useSmartPaste] Processing error:", error);
      resetNERModel();
      const fallbackTxn = createFallbackTransaction(rawText);
      setError('ML failed. Using fallback.');
      if (fallbackTxn) {
        console.log("[useSmartPaste] Error recovery: created fallback transaction", fallbackTxn);
        setDetectedTransactions([fallbackTxn]);
        setMatchOrigin("fallback");
        
        // Check if confidence is low (< 0.4) for error fallback
        const fallbackConfidence = 0.3;
        
        // Redirect to Train Model page if confidence is low
        if (fallbackConfidence < 0.4) {
          console.log("[useSmartPaste] Low confidence after error, redirecting to Train Model");
          navigate(`/train-model?msg=${encodeURIComponent(rawText)}&sender=${encodeURIComponent(currentSenderHint || '')}`);
          setIsProcessing(false);
          return;
        }
        
        onTransactionsDetected?.([fallbackTxn], rawText, undefined, fallbackConfidence, true, "fallback");
      } else {
        console.log("[useSmartPaste] Error recovery failed, no transaction detected");
        setDetectedTransactions([]);
      }
    } finally {
      console.log("[useSmartPaste] Text processing completed");
      setIsProcessing(false);
    }
  };

  /**
   * Creates a basic fallback transaction by extracting patterns from text.
   * Used when more sophisticated detection methods fail.
   * Attempts to identify amounts, transaction types, and simple patterns.
   */
  const createFallbackTransaction = (text: string): Transaction | null => {
    console.log("[useSmartPaste] Creating fallback transaction from text");
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 0;
    
    if (!amount) {
      console.log("[useSmartPaste] Fallback failed: No amount found in text");
      return null;
    }

    const lower = text.toLowerCase();
    const isExpense = lower.includes('شراء') || lower.includes('paid');
    const isIncome = lower.includes('راتب') || lower.includes('credited');
    console.log("[useSmartPaste] Fallback analysis:", { amount, isExpense, isIncome });
    
    setMatchOrigin("fallback");

    return {
      id: `fallback-${Math.random().toString(36).substring(2, 9)}`,
      title: `Fallback: ${amount}`,
      amount: isIncome ? amount : -Math.abs(amount),
      currency: 'SAR',
      type: isIncome ? 'income' : 'expense',
      fromAccount: 'Unknown',
      category: 'Uncategorized',
      subcategory: '',
      date: new Date().toISOString(),
      description: text,
      notes: 'Parsed fallback',
      source: 'smart-paste'
    };
  };

  return {
    text,
    setText,
    detectedTransactions,
    setDetectedTransactions,
    isSmartMatch,
    isProcessing,
    error,
    handlePaste,
    processText,
    structureMatch,
    setCurrentSenderHint,
    matchOrigin
  };
};
