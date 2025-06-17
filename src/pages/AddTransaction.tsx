import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full py-4 sm:py-[var(--page-padding-y)] space-y-4 sm:space-y-6 px-[var(--page-padding-x)]"
      >
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Add Transaction</h1>
        </div>

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
