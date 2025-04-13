
import { useState } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { findCategoryForVendor } from '@/services/CategoryInferencer';
import { useToast } from '@/components/ui/use-toast';
import { resetNERModel } from '@/ml/ner';

export const useSmartPaste = (
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number) => void
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
      // Try ML-based extraction first
      const parsed = await extractTransactionEntities(rawText);

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
          description: rawText,
          notes: 'Extracted with ML',
          source: 'smart-paste',
        };

        setDetectedTransactions([autoTxn]);
        setIsSmartMatch(true);
        
        // Call the callback if provided but DO NOT learn yet - wait for user confirmation
        if (onTransactionsDetected) {
          onTransactionsDetected([autoTxn], rawText, undefined, isSmartMatch ? 0.8 : 0.5);
        }
      } else {
        // If ML parsing didn't find an amount, use fallback
        const fallbackTransaction = createFallbackTransaction(rawText);
        
        if (fallbackTransaction) {
          setDetectedTransactions([fallbackTransaction]);
          setIsSmartMatch(false);
          
          if (onTransactionsDetected) {
            onTransactionsDetected([fallbackTransaction], rawText, undefined, 0.3);
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
          onTransactionsDetected([fallbackTransaction], rawText, undefined, 0.3);
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
