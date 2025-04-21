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
//import { learningEngineService } from '@/services/LearningEngineService';
import {
  loadKeywordBank,
  saveKeywordBank,
} from '@/lib/smart-paste-engine/keywordBankUtils';

/**
 * ImportTransactions page component for handling different import methods.
 * Provides UI for smart paste and Telegram bot setup methods.
 * Manages the transaction detection flow and forwards to edit page.
 */
const ImportTransactions = () => {
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const { addTransactions } = useTransactions();
  const { toast } = useToast();
  const navigate = useNavigate();

  console.log('[ImportTransactions] Page initialized');

  /**
   * Handles detected transactions from the SmartPaste component.
   * Calculates matching statistics and navigates to the edit page.
   */
  const handleTransactionsDetected = (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    shouldTrain?: boolean,
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback'
  ) => {
    console.log('[ImportTransactions] Transactions detected', {
      count: transactions.length,
	  transaction: transactions[0],
      rawMessageLength: rawMessage?.length,
      senderHint,
      confidence,
      shouldTrain,
      matchOrigin,
    });

    const transaction = transactions[0];
    //const entries = learningEngineService.getLearnedEntries();

/*    const matchedCount = entries.filter((entry) => {
      return (
        Math.abs(entry.confirmedFields.amount - (transaction?.amount || 0)) < 0.01 &&
        entry.confirmedFields.category === transaction?.category &&
        entry.confirmedFields.type === transaction?.type
      );
    }).length;

    console.log('[ImportTransactions] Match statistics', {
      matchedCount,
      totalTemplates: entries.length,
    });
*/


    // ✅ Auto-learn logic from transaction vendor
    if (shouldTrain && transaction.vendor) {
      /*const keyword = transaction.vendor.toLowerCase().split(' ')[0];
      const existing = loadKeywordBank();
      const exists = existing.find((k) => k.keyword === keyword);

      const inferredMappings = [
        { field: 'type', value: transaction.type },
        { field: 'category', value: transaction.category },
        { field: 'subcategory', value: transaction.subcategory },
        { field: 'fromAccount', value: transaction.fromAccount },
        { field: 'vendor', value: transaction.vendor },
      ].filter((entry) => entry.value && entry.value !== '');

      if (!exists && inferredMappings.length > 0) {
        const newEntry = {
          keyword,
          mappings: inferredMappings,
        };
        console.log('[AutoLearn] Adding keyword:', newEntry);
        //saveKeywordBank([...existing, newEntry]);
      }*/
    }

    console.log('[ImportTransactions] Navigate to edit with parameters:', {
      shouldTrain,
      matchOrigin,
      transaction,
    });

    navigate('/edit-transaction', {
      state: {
        transaction,
        rawMessage,
        senderHint,
        confidence,
         matchedCount: 0, // fallback default
		totalTemplates: 0, // fallback default
        isSuggested: true,
        shouldTrain,
        matchOrigin,
      },
    });
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 sm:px-6 md:px-8 max-w-full space-y-6 mt-4 py-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              console.log('[ImportTransactions] Navigating back');
              navigate(-1);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Import Transactions</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import Transactions</CardTitle>
            <CardDescription>
              Import your transactions from SMS, Telegram, or by pasting bank messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-3">Smart Paste</h3>
                <SmartPaste onTransactionsDetected={handleTransactionsDetected} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Telegram Bot</h3>
                <TelegramBotSetup />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default ImportTransactions;
