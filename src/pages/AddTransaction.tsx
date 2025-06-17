import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  CardHeader,
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
        className="w-full px-1"
      >

        <Card className="w-full">
          <CardHeader className="pb-2" />
          <CardContent className="pt-0">
            <TransactionEditForm onSave={handleSave} />
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default AddTransaction;
