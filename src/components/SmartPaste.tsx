
// src/components/SmartPaste.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardPaste, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction, TransactionType } from '@/types/transaction';
import { storeTransaction } from '@/utils/storage-utils';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { findCategoryForVendor } from '@/services/CategoryInferencer';

interface SmartPasteProps {
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number) => void;
}

const SmartPaste: React.FC<SmartPasteProps> = ({ onTransactionsDetected }) => {
  const [text, setText] = useState('');
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [isSmartMatch, setIsSmartMatch] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
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
  };

  const handleAddTransaction = (txn: Transaction) => {
    addTransaction(txn);
    storeTransaction(txn);
    toast({ title: 'Transaction Added', description: `${txn.title} saved.` });
    setDetectedTransactions([]);
    setText('');
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

      <div className="space-y-2">
        <Input
          placeholder="Paste a bank SMS message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            processText(e.target.value);
          }}
          className="w-full text-sm"
        />
        <Button onClick={handlePaste} className="w-full sm:w-auto text-sm">
          Paste from Clipboard
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
                <CheckCircle className="h-4 w-4 mr-1" />
                AI Model Matched
              </div>
            </div>
          ))}
        </div>
      )}

      {text && detectedTransactions.length === 0 && (
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
