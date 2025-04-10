
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardPaste, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction } from '@/types/transaction';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { storeTransaction } from '@/utils/storage-utils';

interface SmartPasteProps {
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string) => void;
}

const SmartPaste: React.FC<SmartPasteProps> = ({ onTransactionsDetected }) => {
  const [text, setText] = useState('');
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [isSmartMatch, setIsSmartMatch] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const { findBestMatch } = useLearningEngine();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setText(text);
      processText(text);
    } catch (err) {
      toast({
        title: "Error reading clipboard",
        description: "Failed to read text from clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const processText = (text: string) => {
    // First, try with the learning engine
    if (processWithLearningEngine(text)) {
      return;
    }
    
    // Fallback to basic processing if no smart match
    const amount = parseFloat(text.replace(/[^0-9.-]+/g, ''));
    if (!isNaN(amount)) {
      const transaction = {
        id: `paste-${Math.random().toString(36).substring(2, 9)}`,
        title: `Pasted transaction: ${text.substring(0, 30)}...`,
        amount: amount,
        category: 'Uncategorized',
        date: new Date().toISOString().split('T')[0],
        type: amount > 0 ? 'income' : 'expense',
        notes: `Pasted from text: ${text.substring(0, 100)}`,
        source: 'smart-paste',
        fromAccount: 'Cash'
      } as Transaction;

      setDetectedTransactions([transaction]);
      setIsSmartMatch(false);

      // If onTransactionsDetected is provided, call it
      if (onTransactionsDetected) {
        onTransactionsDetected([transaction], text);
      }
    } else {
      toast({
        title: "No transaction detected",
        description: "Could not automatically detect transaction details from the pasted text.",
      });
      setDetectedTransactions([]);
    }
  };

  const processWithLearningEngine = (text: string) => {
    const matchResult = findBestMatch(text);
    
    if (matchResult.matched && matchResult.entry) {
      const learnedEntry = matchResult.entry;
      
      // Create a transaction using the learned data
      const learnedTransaction = {
        id: `smartpaste-${Math.random().toString(36).substring(2, 9)}`,
        title: `Smart paste: ${text.substring(0, 30)}...`,
        amount: learnedEntry.confirmedFields.amount,
        category: learnedEntry.confirmedFields.category,
        subcategory: learnedEntry.confirmedFields.subcategory,
        date: new Date().toISOString().split('T')[0],
        type: learnedEntry.confirmedFields.type,
        notes: `Smart-detected from text: ${text.substring(0, 100)}`,
        fromAccount: learnedEntry.confirmedFields.account,
        person: learnedEntry.confirmedFields.person,
        currency: learnedEntry.confirmedFields.currency,
        source: 'smart-paste' as 'smart-paste'
      };
      
      setDetectedTransactions([learnedTransaction]);
      setIsSmartMatch(true);
      setConfidence(matchResult.confidence);

      // If onTransactionsDetected is provided, call it
      if (onTransactionsDetected) {
        onTransactionsDetected([learnedTransaction], text);
      }
      
      return true;
    }
    
    return false;
  };

  const handleAddTransaction = (transaction: Transaction) => {
    // Add to transaction context
    addTransaction(transaction);
    
    // Store in local storage
    storeTransaction(transaction);
    
    setText('');
    setDetectedTransactions([]);
    toast({
      title: "Transaction added",
      description: "The transaction has been added to your list.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border rounded-lg space-y-4"
    >
      <div className="flex items-center gap-2">
        <ClipboardPaste className="text-primary h-5 w-5" />
        <h3 className="text-lg font-medium">Smart Paste</h3>
      </div>
      
      <div className="space-y-2">
        <Input
          placeholder="Paste transaction details here..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            processText(e.target.value);
          }}
        />
        <Button onClick={handlePaste} className="w-full">
          Paste from Clipboard
        </Button>
      </div>
      
      {detectedTransactions.length > 0 && (
        <div className="space-y-2">
          {detectedTransactions.map((transaction) => (
            <div key={transaction.id} className="p-3 border rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{transaction.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Amount: {transaction.amount}, Category: {transaction.category}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleAddTransaction(transaction)}>
                  Add Transaction
                </Button>
              </div>
              {isSmartMatch ? (
                <div className="flex items-center mt-2 text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Smart Match (Confidence: {Math.round(confidence * 100)}%)
                </div>
              ) : (
                <div className="flex items-center mt-2 text-yellow-500">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Basic Detection
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {text && detectedTransactions.length === 0 && (
        <div className="text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50">
          <XCircle className="h-4 w-4" />
          No transaction details detected. Please try again or enter manually.
        </div>
      )}
    </motion.div>
  );
};

export default SmartPaste;
