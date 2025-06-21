import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import SmartPaste from '@/components/SmartPaste';
import { Transaction } from '@/types/transaction';

const ImportTransactions = () => {
  const navigate = useNavigate();

  console.log('[ImportTransactions] Page initialized');

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
    console.log('[ImportTransactions] Transactions detected', {
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

    console.log('[ImportTransactions] Navigate to edit with parameters:', {
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
        <PageHeader title="Extract Transaction Details" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-[calc(var(--section-gap)/2)]"
        >
          <div className="bg-card p-[var(--card-padding)] rounded-lg shadow">
            <SmartPaste onTransactionsDetected={handleTransactionsDetected} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ImportTransactions;
