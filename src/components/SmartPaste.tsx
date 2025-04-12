import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardPaste, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction, TransactionType } from '@/types/transaction';
import { storeTransaction } from '@/utils/storage-utils';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { findCategoryForVendor } from '@/services/CategoryInferencer';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SmartPasteProps {
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number) => void;
}

const SmartPaste: React.FC<SmartPasteProps> = ({ onTransactionsDetected }) => {
  const [text, setText] = useState('');
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [isSmartMatch, setIsSmartMatch] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addTransaction } = useTransactions();
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
        
        // Call the callback if provided
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
          
          // Call the callback if provided
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

  const handleAddTransaction = (txn: Transaction) => {
    addTransaction(txn);
    storeTransaction(txn);
    toast({ title: 'Transaction Added', description: `${txn.title} saved.` });
    setDetectedTransactions([]);
    setText('');
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full p-4 border rounded-lg space-y-4 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <ClipboardPaste className="text-primary h-5 w-5" />
        <h3 className="text-lg font-medium">Smart Paste</h3>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Input
          placeholder="Paste a bank SMS message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim()) {
              processText(e.target.value);
            } else {
              setDetectedTransactions([]);
              setError(null);
            }
          }}
          className="w-full text-sm"
          disabled={isProcessing}
        />
        <Button 
          onClick={handlePaste} 
          className="w-full sm:w-auto text-sm"
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Paste from Clipboard"}
        </Button>
      </div>

      {detectedTransactions.length > 0 && (
        <div className="space-y-2">
          {detectedTransactions.map((txn) => (
            <div key={txn.id} className="p-3 border rounded-md">
              <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
                <div>
                  <h4 className="font-medium">{txn.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Amount: {txn.amount} | Category: {txn.category}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                  onClick={() => handleAddTransaction(txn)}
                >
                  Add Transaction
                </Button>
              </div>
              <div className="flex items-center mt-2 text-green-500 text-sm">
                {isSmartMatch ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    AI Model Matched
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                    Basic Text Analysis
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {text && !isProcessing && detectedTransactions.length === 0 && !error && (
        <div className="text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50">
          <XCircle className="h-4 w-4" />
          No transaction detected.
        </div>
      )}

      {showDebug && (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
          {JSON.stringify(detectedTransactions, null, 2)}
        </pre>
      )}
    </motion.div>
  );
};

export default SmartPaste;
