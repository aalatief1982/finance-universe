
import { useState } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { findCategoryForVendor } from '@/services/CategoryInferencer';
import { useToast } from '@/components/ui/use-toast';

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
          notes: 'Extracted with Transformers.js',
          source: 'smart-paste',
        };

        setDetectedTransactions([autoTxn]);
        setIsSmartMatch(true);
        
        // Call the callback if provided but DO NOT learn yet - wait for user confirmation
        if (onTransactionsDetected) {
          onTransactionsDetected([autoTxn], rawText, undefined, isSmartMatch ? 0.8 : 0.5);
        }
      } else {
        setDetectedTransactions([]);
        toast({
          title: 'No transaction detected',
          description: 'Could not extract structured data from the message.',
        });
      }
    } catch (error) {
      console.error('Error processing text:', error);
      let errorMessage = 'Could not process the text. Please try again.';
      
      // Check if it's a JSON parsing error with HTML content
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        errorMessage = 'The ML model could not be loaded properly. The app will use simple text analysis instead.';
        
        // Basic fallback parsing logic
        const fallbackTransaction = createFallbackTransaction(rawText);
        if (fallbackTransaction) {
          setDetectedTransactions([fallbackTransaction]);
          setIsSmartMatch(false);
          
          // Call the callback if provided - but don't learn yet
          if (onTransactionsDetected) {
            onTransactionsDetected([fallbackTransaction], rawText, undefined, 0.3);
          }
        }
      }
      
      setError(errorMessage);
      toast({
        title: 'Processing Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback function to extract basic transaction data when ML model fails
  const createFallbackTransaction = (text: string): Transaction | null => {
    // Simple regex to find amounts (numbers with optional decimal places)
    const amountMatch = text.match(/(\d+(\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
    
    if (!amount) return null;
    
    // Try to identify if it's an expense or income
    const lowerText = text.toLowerCase();
    const isExpense = lowerText.includes('debit') || 
                     lowerText.includes('purchase') || 
                     lowerText.includes('paid') ||
                     lowerText.includes('withdraw');
    
    const isIncome = lowerText.includes('credit') || 
                    lowerText.includes('deposit') || 
                    lowerText.includes('received') ||
                    lowerText.includes('salary');
    
    // Extract potential vendor name (just a simple approach)
    let vendor = "Unknown";
    if (text.includes('at') || text.includes('to') || text.includes('from')) {
      const parts = text.split(/\s+(?:at|to|from)\s+/);
      if (parts.length > 1) {
        vendor = parts[1].split(/\s+/)[0];
      }
    }
    
    return {
      id: `fallback-${Math.random().toString(36).substring(2, 9)}`,
      title: `Fallback: ${vendor} | ${amount}`,
      amount: isIncome ? amount : -Math.abs(amount),
      currency: 'SAR', // Default currency
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
