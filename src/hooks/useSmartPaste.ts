
import { useState, useCallback } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { findCategoryForVendor } from '@/services/CategoryInferencer';
import { useToast } from '@/components/ui/use-toast';
import { resetNERModel } from '@/ml/ner';
import { learningEngineService } from '@/services/LearningEngineService';
import { useNavigate } from 'react-router-dom';

export const useSmartPaste = (
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number, shouldTrain?: boolean, matchOrigin?: "template" | "structure" | "ml" | "fallback") => void,
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

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      processText(clipboardText);
    } catch (err) {
      toast({
        title: 'Clipboard Error',
        description: 'Could not read from clipboard.',
        variant: 'destructive',
      });
    }
  };

  const processText = async (rawText: string) => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Try LearningEngine template match
      const match = learningEngineService.findBestMatch(rawText);
      if (match.matched && match.entry) {
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

        setDetectedTransactions([txn]);
        setIsSmartMatch(true);
        setMatchOrigin("template");
        onTransactionsDetected?.([txn], rawText, match.entry.senderHint, match.confidence, false, "template");
        return;
      }

      // 2. Structure-based fallback
      const structureMatch = learningEngineService.matchUsingTemplateStructure?.(rawText);
      setStructureMatch(structureMatch);
      
      if (structureMatch && structureMatch.inferredTransaction) {
        const vendorName = structureMatch.inferredTransaction.description || '';
        const categoryInfo = findCategoryForVendor(vendorName, structureMatch.inferredTransaction.type || 'expense');

        const txn: Transaction = {
          id: `structure-${Math.random().toString(36).substring(2, 9)}`,
          title: `Structure: ${categoryInfo.category} | ${structureMatch.inferredTransaction.amount}`,
          amount: structureMatch.inferredTransaction.amount || 0,
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

        setDetectedTransactions([txn]);
        setIsSmartMatch(true);
        setMatchOrigin("structure");
        onTransactionsDetected?.([txn], rawText, undefined, structureMatch.confidence, true, "structure");
        return;
      }

      // 3. ML fallback
      const parsed = await extractTransactionEntities(rawText, useHighAccuracy);
      if (parsed.amount) {
        // Use the vendor property instead of description since that's what's available in the parsed output
        const categoryInfo = findCategoryForVendor(parsed.vendor || '', parsed.type || 'expense');
        const txn: Transaction = {
          id: `ml-${Math.random().toString(36).substring(2, 9)}`,
          title: `AI: ${categoryInfo.category} | ${parsed.amount}`,
          amount: parseFloat(parsed.amount),
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

        setDetectedTransactions([txn]);
        setIsSmartMatch(true);
        setMatchOrigin("ml");
        onTransactionsDetected?.([txn], rawText, undefined, 0.65, true, "ml");
        return;
      }

      // 4. Final basic fallback
      // Check if fallback confidence is low (< 0.4) for fallback
      const fallbackTxn = createFallbackTransaction(rawText);
      if (fallbackTxn) {
        setDetectedTransactions([fallbackTxn]);
        setIsSmartMatch(false);
        setMatchOrigin("fallback");
        
        // Check if confidence is low (< 0.4) for fallback
        const fallbackConfidence = 0.3;
        
        // Redirect to Train Model page if confidence is low
        if (fallbackConfidence < 0.4) {
          navigate(`/train-model?msg=${encodeURIComponent(rawText)}&sender=${encodeURIComponent(currentSenderHint || '')}`);
          setIsProcessing(false);
          return;
        }
        
        onTransactionsDetected?.([fallbackTxn], rawText, undefined, fallbackConfidence, true, "fallback");
      } else {
        setDetectedTransactions([]);
        toast({ title: 'No transaction detected', description: 'Message could not be parsed.' });
      }

    } catch (error) {
      console.error(error);
      resetNERModel();
      const fallbackTxn = createFallbackTransaction(rawText);
      setError('ML failed. Using fallback.');
      if (fallbackTxn) {
        setDetectedTransactions([fallbackTxn]);
        setMatchOrigin("fallback");
        
        // Check if confidence is low (< 0.4) for error fallback
        const fallbackConfidence = 0.3;
        
        // Redirect to Train Model page if confidence is low
        if (fallbackConfidence < 0.4) {
          navigate(`/train-model?msg=${encodeURIComponent(rawText)}&sender=${encodeURIComponent(currentSenderHint || '')}`);
          setIsProcessing(false);
          return;
        }
        
        onTransactionsDetected?.([fallbackTxn], rawText, undefined, fallbackConfidence, true, "fallback");
      } else {
        setDetectedTransactions([]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const createFallbackTransaction = (text: string): Transaction | null => {
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 0;
    if (!amount) return null;

    const lower = text.toLowerCase();
    const isExpense = lower.includes('شراء') || lower.includes('paid');
    const isIncome = lower.includes('راتب') || lower.includes('credited');
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
