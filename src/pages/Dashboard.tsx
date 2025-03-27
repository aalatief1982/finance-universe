import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Dialog } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/context/UserContext';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';

// Import the component files
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MobileSmsButton from '@/components/dashboard/MobileSmsButton';
import DashboardContent from '@/components/dashboard/DashboardContent';
import TransactionDialog from '@/components/dashboard/TransactionDialog';

const Dashboard = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const { toast } = useToast();
  const { user } = useUser();
  const { transactions, addTransaction, isLoading } = useTransactions();

  const handleAddTransaction = (formData: any) => {
    try {
      const newTransaction: Omit<Transaction, 'id'> = {
        title: formData.title,
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
        type: formData.amount >= 0 ? 'income' : 'expense',
        notes: formData.notes || '',
      };

      addTransaction(newTransaction);
      setIsAddingExpense(false);
      
      toast({
        title: "Transaction added",
        description: `${newTransaction.title} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <DashboardHeader 
            user={user} 
            setIsAddingExpense={setIsAddingExpense}
          />
          
          <MobileSmsButton />
          
          <DashboardContent 
            transactions={transactions}
            filter={filter}
            setFilter={setFilter}
            setIsAddingExpense={setIsAddingExpense}
            isLoading={isLoading}
          />
        </motion.div>
      </Layout>

      <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
        <TransactionDialog
          isOpen={isAddingExpense}
          onClose={() => setIsAddingExpense(false)}
          onSubmit={handleAddTransaction}
        />
      </Dialog>
    </>
  );
};

export default Dashboard;
