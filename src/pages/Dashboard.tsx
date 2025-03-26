
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Dialog } from '@/components/ui/dialog';
import { INITIAL_TRANSACTIONS, Transaction } from '@/lib/mock-data';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/context/UserContext';

// Import the new component files
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MobileSmsButton from '@/components/dashboard/MobileSmsButton';
import DashboardContent from '@/components/dashboard/DashboardContent';
import TransactionDialog from '@/components/dashboard/TransactionDialog';

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load transactions from localStorage or use initial data
    try {
      setIsLoading(true);
      const storedTransactions = localStorage.getItem('transactions');
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions(INITIAL_TRANSACTIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Save transactions to localStorage whenever they change
    if (!isLoading && transactions.length > 0) {
      try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error('Error saving transactions:', error);
      }
    }
  }, [transactions, isLoading]);

  const handleAddTransaction = (formData: any) => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      title: formData.title,
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      type: formData.amount >= 0 ? 'income' : 'expense',
      notes: formData.notes,
    };

    setTransactions([newTransaction, ...transactions]);
    setIsAddingExpense(false);
    
    toast({
      title: "Transaction added",
      description: `${newTransaction.title} has been added successfully.`,
    });
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
          
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          ) : (
            <DashboardContent 
              transactions={transactions}
              filter={filter}
              setFilter={setFilter}
              setIsAddingExpense={setIsAddingExpense}
            />
          )}
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
