
import { useState } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { findCategoryForVendor } from '@/services/CategoryInferencer';
import { useToast } from '@/components/ui/use-toast';
import { resetNERModel } from '@/ml/ner';
import { learningEngineService } from '@/services/LearningEngineService';

export const useSmartPaste = (
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number, shouldTrain?: boolean) => void,
  useHighAccuracy: boolean = false
) => {
  const [text, setText] = useState('');
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [isSmartMatch, setIsSmartMatch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
    if (!rawText.trim()) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // First try template matching with learning engine
      console.log("Trying template matching with LearningEngine");
      const match = learningEngineService.findBestMatch(rawText);
      console.log("Template match result:", match);
      
      // If we have a good match from templates, use it
      if (match.matched && match.entry) {
        console.log("Using template match with confidence:", match.confidence);
        
        const { confirmedFields } = match.entry;
        const categoryInfo = findCategoryForVendor(confirmedFields.vendor || '', confirmedFields.type || 'expense');
        
        const templateTxn: Transaction = {
          id: `template-${Math.random().toString(36).substring(2, 9)}`,
          title: `Template: ${categoryInfo.category} | ${confirmedFields.amount}`,
          amount: confirmedFields.amount,
          currency: confirmedFields.currency,
          type: confirmedFields.type,
          fromAccount: confirmedFields.account || 'Unknown',
          category: confirmedFields.category || categoryInfo.category,
          subcategory: confirmedFields.subcategory || categoryInfo.subcategory,
          date: new Date().toISOString(),
          description: confirmedFields.vendor || '',
          notes: 'Extracted from template',
          source: 'smart-paste',
          person: confirmedFields.person
        };
        
        setDetectedTransactions([templateTxn]);
        setIsSmartMatch(true);
        
        if (onTransactionsDetected) {
          onTransactionsDetected([templateTxn], rawText, match.entry.senderHint, match.confidence, false);
        }
        
        setIsProcessing(false);
        return;
      }

      // If no template match, try ML-based extraction
      console.log("No template match found, trying ML extraction");
      const parsed = await extractTransactionEntities(rawText, useHighAccuracy);

      if (parsed.amount) {
        const categoryInfo = findCategoryForVendor(parsed.vendor || '', parsed.type || 'expense');

        const autoTxn: Transaction = {
          id: `ml-${Math.random().toString(36).substring(2, 9)}`,
          title: `AI: ${categoryInfo.category} | ${parsed.amount}`,
          amount: parseFloat(parsed.amount),
          currency: parsed.currency || 'SAR',
          type: (parsed.type as TransactionType) || 'expense',
          fromAccount: parsed.account || 'Unknown',
          category: categoryInfo.category,
          subcategory: categoryInfo.subcategory,
          date: parsed.date || new Date().toISOString(),
          description: parsed.vendor || '',
          notes: 'Extracted with ML',
          source: 'smart-paste',
        };

        setDetectedTransactions([autoTxn]);
        setIsSmartMatch(true);
        
        if (onTransactionsDetected) {
          // Pass the shouldTrain flag from the match result
          onTransactionsDetected([autoTxn], rawText, undefined, match.confidence, match.shouldTrain);
        }
      } else {
        // If ML parsing didn't find an amount, use fallback
        console.log("ML extraction failed, using fallback");
        const fallbackTransaction = createFallbackTransaction(rawText);
        
        if (fallbackTransaction) {
          setDetectedTransactions([fallbackTransaction]);
          setIsSmartMatch(false);
          
          if (onTransactionsDetected) {
            // Pass the shouldTrain flag from the match result
            onTransactionsDetected([fallbackTransaction], rawText, undefined, match.confidence, match.shouldTrain);
          }
        } else {
          setDetectedTransactions([]);
          toast({
            title: 'No transaction detected',
            description: 'Could not extract data from the message.',
          });
        }
      }
    } catch (error) {
      console.error('Error processing text:', error);
      
      // If ML model loading failed, reset it so we can try again later
      resetNERModel();
      
      // Always try fallback method
      const fallbackTransaction = createFallbackTransaction(rawText);
      
      let errorMessage = 'Could not process the text with ML model. Using simple text analysis instead.';
      
      if (fallbackTransaction) {
        setDetectedTransactions([fallbackTransaction]);
        setIsSmartMatch(false);
        
        if (onTransactionsDetected) {
          onTransactionsDetected([fallbackTransaction], rawText, undefined, 0.3, true); // Always suggest training for fallback
        }
      } else {
        errorMessage = 'Could not extract transaction details from the message.';
        setDetectedTransactions([]);
      }
      
      setError(errorMessage);
      toast({
        title: 'Processing Note',
        description: errorMessage,
        variant: fallbackTransaction ? 'default' : 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback function to extract basic transaction data when ML model fails
  const createFallbackTransaction = (text: string): Transaction | null => {
    // Simple regex to find amounts (numbers with optional decimal places)
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 0;
    
    if (!amount) return null;
    
    // Try to identify if it's an expense or income
    const lowerText = text.toLowerCase();
    const isExpense = lowerText.includes('debit') || 
                     lowerText.includes('purchase') || 
                     lowerText.includes('paid') ||
                     lowerText.includes('withdraw') ||
                     lowerText.includes('شراء') ||
                     lowerText.includes('دفع') ||
                     lowerText.includes('سحب');
    
    const isIncome = lowerText.includes('credit') || 
                    lowerText.includes('deposit') || 
                    lowerText.includes('received') ||
                    lowerText.includes('salary') ||
                    lowerText.includes('إيداع') ||
                    lowerText.includes('استلام') ||
                    lowerText.includes('راتب');
    
    // Extract potential vendor name (just a simple approach)
    let vendor = "Unknown";
    if (text.includes('at') || text.includes('to') || text.includes('from') || 
        text.includes('في') || text.includes('إلى') || text.includes('من')) {
      const parts = text.split(/\s+(?:at|to|from|في|إلى|من)\s+/);
      if (parts.length > 1) {
        vendor = parts[1].split(/\s+/)[0];
      }
    }
    
    return {
      id: `fallback-${Math.random().toString(36).substring(2, 9)}`,
      title: `Fallback: ${vendor} | ${amount}`,
      amount: isIncome ? amount : -Math.abs(amount),
      currency: detectCurrency(text),
      type: isIncome ? 'income' : 'expense',
      fromAccount: 'Unknown',
      category: 'Uncategorized',
      subcategory: '',
      date: new Date().toISOString(),
      description: text,
      notes: 'Extracted with fallback parser',
      source: 'smart-paste',
    };
  };
  
  // Detect currency from text
  const detectCurrency = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('sar') || lowerText.includes('ريال') || lowerText.includes('سعودي')) {
      return 'SAR';
    } else if (lowerText.includes('egp') || lowerText.includes('جنيه') || lowerText.includes('مصري')) {
      return 'EGP';
    } else if (lowerText.includes('usd') || lowerText.includes('$') || lowerText.includes('dollar')) {
      return 'USD';
    } else if (lowerText.includes('eur') || lowerText.includes('€') || lowerText.includes('euro')) {
      return 'EUR';
    } else if (lowerText.includes('aed') || lowerText.includes('درهم') || lowerText.includes('إماراتي')) {
      return 'AED';
    }
    
    // Default currency (from user preferences)
    return 'SAR';
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
    processText
  };
};
