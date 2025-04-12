
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardPaste } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction } from '@/types/transaction';
import { storeTransaction } from '@/utils/storage-utils';
import { useSmartPaste } from '@/hooks/useSmartPaste';
import TransactionInput from './smart-paste/TransactionInput';
import ErrorAlert from './smart-paste/ErrorAlert';
import DetectedTransactionCard from './smart-paste/DetectedTransactionCard';
import NoTransactionMessage from './smart-paste/NoTransactionMessage';

interface SmartPasteProps {
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number) => void;
}

const SmartPaste: React.FC<SmartPasteProps> = ({ onTransactionsDetected }) => {
  const [showDebug, setShowDebug] = useState(false);
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  
  const {
    text,
    setText,
    detectedTransactions,
    setDetectedTransactions,
    isSmartMatch,
    isProcessing,
    error,
    handlePaste,
    processText
  } = useSmartPaste(onTransactionsDetected);

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (newText.trim()) {
      processText(newText);
    } else {
      // If text is cleared, reset detected transactions
      setText('');
      setDetectedTransactions([]);
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

      <ErrorAlert error={error} />

      <TransactionInput 
        text={text}
        isProcessing={isProcessing}
        onTextChange={handleTextChange}
        onPaste={handlePaste}
      />

      {detectedTransactions.length > 0 && (
        <div className="space-y-2">
          {detectedTransactions.map((txn) => (
            <DetectedTransactionCard
              key={txn.id}
              transaction={txn}
              isSmartMatch={isSmartMatch}
              onAddTransaction={handleAddTransaction}
            />
          ))}
        </div>
      )}

      <NoTransactionMessage 
        show={text && !isProcessing && detectedTransactions.length === 0 && !error}
      />

      {showDebug && (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
          {JSON.stringify(detectedTransactions, null, 2)}
        </pre>
      )}
    </motion.div>
  );
};

export default SmartPaste;
