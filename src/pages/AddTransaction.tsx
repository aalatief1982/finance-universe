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
    <Layout showBack>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full py-[var(--page-padding-y)] space-y-4 sm:space-y-6 px-[var(--page-padding-x)]"
      >

        <h1 className="text-xl sm:text-2xl font-bold">Add Transaction</h1>

        <Card className="w-full">
          <CardHeader className="pb-2">
            {/* <CardTitle>Create a new transaction</CardTitle> */}
          </CardHeader>
          <CardContent className="pt-0">
            <TransactionEditForm onSave={handleSave} />
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default AddTransaction;
