import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import NERSmartPaste from '@/components/NERSmartPaste';
import { Transaction } from '@/types/transaction';

// This page demonstrates SMS parsing using only the NER model.
// When the transaction is saved the learning engine will still
// learn from it via EditTransaction.tsx.
const ImportTransactionsNER = () => {
  const navigate = useNavigate();

  console.log('[ImportTransactionsNER] Page initialized');

  const handleTransactionsDetected = (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback',
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number
  ) => {
    console.log('[ImportTransactionsNER] Transactions detected', {
      count: transactions.length,
      transaction: transactions[0],
      rawMessageLength: rawMessage?.length,
      senderHint,
      confidence,
      //shouldTrain,
      matchOrigin,
    });

    const transaction = transactions[0];

    if (!transaction.id?.trim()) {
      console.warn('⚠️ Empty or invalid transaction.id:', transaction);
    }

    console.log('[ImportTransactionsNER] Navigate to edit with parameters:', {
      //shouldTrain,
      matchOrigin,
      transaction,
    });

    navigate('/edit-transaction', {
  state: {
	transaction: {
	  ...transaction,
	  rawMessage: rawMessage ?? '',
	},
    rawMessage,
    senderHint,
    confidence,
    matchedCount,
    totalTemplates,
    fieldScore,
    keywordScore,
    isSuggested: true,
    matchOrigin,
  },
});
  };

  return (
    <Layout withPadding={false} fullWidth showBack>
      <div className="px-1">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-[calc(var(--section-gap)/2)]"
        >
          <div className="bg-card p-[var(--card-padding)] rounded-lg shadow">
            <NERSmartPaste onTransactionsDetected={handleTransactionsDetected} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ImportTransactionsNER;
