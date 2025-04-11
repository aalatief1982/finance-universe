
// Updated SmartPaste.tsx with merged enhancements
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
import ExpenseForm from '@/components/ExpenseForm';
import { CATEGORIES } from '@/lib/mock-data';

const SmartPaste: React.FC<{
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number) => void;
}> = ({ onTransactionsDetected }) => {
  const [text, setText] = useState('');
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [isSmartMatch, setIsSmartMatch] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const { findBestMatch, inferFieldsFromText } = useLearningEngine();

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      processText(clipboardText);
    } catch (err) {
      toast({
        title: 'Clipboard Error',
        description: 'Could not read from clipboard.',
        variant: 'destructive'
      });
    }
  };

  const processText = (text: string) => {
    if (!text || text.trim() === '') {
      toast({
        title: 'Empty Text',
        description: 'Please paste a transaction message first.',
        variant: 'destructive'
      });
      return;
    }
    
    const result = findBestMatch(text);

    if (result.matched && result.entry) {
      const learned = result.entry.confirmedFields;
      const smartTransaction: Transaction = {
        id: `smartpaste-${Math.random().toString(36).substring(2, 9)}`,
        title: `Smart ${learned.category} | ${learned.subcategory} | ${learned.amount}`,
        amount: learned.amount,
        category: learned.category,
        subcategory: learned.subcategory,
        type: learned.type,
        currency: learned.currency,
        person: learned.person,
        date: new Date().toISOString().split('T')[0],
        description: text,
        notes: 'Detected via SmartPaste',
        source: 'smart-paste',
        fromAccount: learned.account,
        toAccount: '',
      };

      setDetectedTransactions([smartTransaction]);
      setIsSmartMatch(true);
      setConfidence(result.confidence);
      return;
    }

    // Fallback to rule-based inference if no match
    const inferred = inferFieldsFromText(text);
    if (inferred) {
      const fallbackTxn: Transaction = {
        id: `manual-${Math.random().toString(36).substring(2, 9)}`,
        title: inferred.title || 'Untitled',
        amount: inferred.amount || 0,
        category: inferred.category || 'Uncategorized',
        subcategory: inferred.subcategory || '',
        type: inferred.type || 'expense',
        currency: inferred.currency || 'SAR',
        fromAccount: inferred.account || 'Unknown',
        date: inferred.date || new Date().toISOString().split('T')[0],
        description: text,
        notes: 'Detected by rule-based fallback',
        source: 'smart-paste'
      };
      setDetectedTransactions([fallbackTxn]);
      setIsSmartMatch(false);
      return;
    }

    toast({ title: 'No transaction found', description: 'Could not parse any transaction data from pasted content.' });
  };

  const handleAddTransaction = (txn: Transaction) => {
    addTransaction(txn);
    storeTransaction(txn);
    toast({ title: 'Transaction Added', description: `${txn.title} saved.` });
    setDetectedTransactions([]);
    setText('');
    
    if (onTransactionsDetected) {
      onTransactionsDetected([txn], text, undefined, isSmartMatch ? confidence : 0);
    }
  };
  
  const handleEditTransaction = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setShowForm(true);
  };
  
  const handleFormSubmit = (values: any) => {
    const updatedTransaction: Transaction = {
      ...selectedTransaction!,
      ...values
    };
    handleAddTransaction(updatedTransaction);
    setShowForm(false);
    setSelectedTransaction(null);
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
          placeholder="Paste message here..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) {
              processText(e.target.value);
            }
          }}
        />
        <Button onClick={handlePaste} className="w-full">Paste from Clipboard</Button>
      </div>

      {showForm && selectedTransaction && (
        <div className="mt-4">
          <ExpenseForm 
            onSubmit={handleFormSubmit}
            categories={CATEGORIES}
            defaultValues={selectedTransaction}
            onCancel={() => {
              setShowForm(false);
              setSelectedTransaction(null);
            }}
          />
        </div>
      )}

      {!showForm && detectedTransactions.length > 0 && (
        <div className="space-y-2">
          {detectedTransactions.map(txn => (
            <div key={txn.id} className="p-3 border rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{txn.title}</h4>
                  <p className="text-sm text-muted-foreground">Amount: {txn.amount} | Category: {txn.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditTransaction(txn)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddTransaction(txn)}>
                    Add
                  </Button>
                </div>
              </div>
              <div className={`flex items-center mt-2 ${isSmartMatch ? 'text-green-500' : 'text-yellow-500'}`}>
                {isSmartMatch ? <CheckCircle className="h-4 w-4 mr-1" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
                {isSmartMatch ? `Smart Match (${Math.round(confidence * 100)}%)` : 'Rule-based fallback'}
              </div>
            </div>
          ))}
        </div>
      )}

      {text && !showForm && detectedTransactions.length === 0 && (
        <div className="text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50">
          <XCircle className="h-4 w-4" />
          No transaction detected.
        </div>
      )}
    </motion.div>
  );
};

export default SmartPaste;
