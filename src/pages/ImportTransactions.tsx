import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import TelegramBotSetup from '@/components/TelegramBotSetup';
import SmartPaste from '@/components/SmartPaste';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  loadKeywordBank,
  saveKeywordBank,
} from '@/lib/smart-paste-engine/keywordBankUtils';

const ImportTransactions = () => {
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const { addTransactions } = useTransactions();
  const { toast } = useToast();
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
    <Layout withPadding={false}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-[calc(var(--safe-area-top)+56px)] px-[var(--page-padding-x)]"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Import Transactions</h1>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4">
            <SmartPaste onTransactionsDetected={handleTransactionsDetected} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Telegram Bot</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Connect your Telegram account to forward messages directly for transaction extraction.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <TelegramBotSetup />
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default ImportTransactions;
