
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import ExpenseForm from '@/components/ExpenseForm';
import TransactionList from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { getCategoriesForType } from '@/lib/categories-data';
import { Transaction } from '@/types/transaction';

const Dashboard = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const { addTransaction, transactions } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>(getCategoriesForType('expense'));

  const handleAddExpense = (data: any) => {
    const amount = data.amount * (data.type === 'expense' ? -1 : 1); 
    
    const newTransaction: Omit<Transaction, 'id'> = {
      title: data.title,
      amount,
      category: data.category,
      date: data.date,
      type: data.type,
      notes: data.notes,
      source: 'manual',
      fromAccount: data.fromAccount,
      toAccount: data.toAccount,
      person: data.person,
      currency: data.currency
    };
    
    addTransaction(newTransaction);
    setIsAddingExpense(false);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container max-w-7xl mx-auto py-6 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {user ? `Welcome back, ${user.fullName ? user.fullName.split(' ')[0] : 'User'}!` : 'Dashboard'}
          </h1>
          <Button onClick={() => setIsAddingExpense(true)}>
            <Plus className="mr-2" size={16} /> Add Transaction
          </Button>
        </div>

        {/* Add Expense Form */}
        {isAddingExpense && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Add New Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseForm
                  onSubmit={handleAddExpense}
                  categories={categories}
                  onCancel={() => setIsAddingExpense(false)}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <TransactionList 
                transactions={transactions} 
                onEdit={(transaction) => navigate(`/transactions?edit=${transaction.id}`)}
                onDelete={(id) => console.log('Delete transaction:', id)}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
