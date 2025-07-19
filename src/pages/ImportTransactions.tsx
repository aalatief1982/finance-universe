
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import SmartPaste from '@/components/SmartPaste';
import { Transaction } from '@/types/transaction';

const ImportTransactions = () => {
  const navigate = useNavigate();

  if (import.meta.env.MODE === 'development') {
    console.log('[ImportTransactions] Page initialized');
  }

  const handleTransactionsDetected = (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback',
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number,
    fieldConfidences?: Record<string, number>
  ) => {
    if (import.meta.env.MODE === 'development') console.log('[ImportTransactions] onTransactionsDetected called with:', {
      count: transactions.length,
      transaction: transactions[0],
      rawMessageLength: rawMessage?.length,
      senderHint,
      confidence,
      matchOrigin,
      fieldConfidences,
      fieldConfidencesKeys: fieldConfidences ? Object.keys(fieldConfidences) : [],
      fieldConfidencesValues: fieldConfidences ? Object.values(fieldConfidences) : []
    });

    const transaction = transactions[0];

    if (!transaction.id?.trim()) {
      if (import.meta.env.MODE === 'development') {
        console.warn('⚠️ Empty or invalid transaction.id:', transaction);
      }
    }

    if (import.meta.env.MODE === 'development') console.log('[ImportTransactions] Navigate to edit with parameters:', {
      matchOrigin,
      transaction,
      fieldConfidences,
      fieldConfidencesStringified: JSON.stringify(fieldConfidences),
      navigationState: {
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
        fieldConfidences,
        isSuggested: true,
        matchOrigin,
      }
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
        fieldConfidences,
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
            <SmartPaste onTransactionsDetected={handleTransactionsDetected} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ImportTransactions;
