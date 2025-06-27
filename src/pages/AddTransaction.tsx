import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTransactions } from '@/context/TransactionContext';
import TransactionEditForm from '@/components/TransactionEditForm';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { saveTransactionWithLearning } from '@/lib/smart-paste-engine/saveTransactionWithLearning';
import { Transaction } from '@/types/transaction';

const AddTransaction = () => {
  const navigate = useNavigate();
  const { addTransaction, updateTransaction } = useTransactions();
  const { learnFromTransaction } = useLearningEngine();

  const handleSave = (txn: Transaction) => {
    saveTransactionWithLearning(txn, {
      isNew: true,
      addTransaction,
      updateTransaction,
      learnFromTransaction,
      navigateBack: () => navigate(-1),
    });
  };

  return (
    <Layout showBack withPadding={false} fullWidth>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full px-1 dark:bg-black dark:text-white min-h-screen"
      >

        <Card className="w-full">
          <CardContent className="pt-[var(--card-padding)]">
            <TransactionEditForm onSave={handleSave} compact showNotes={false} />
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default AddTransaction;
