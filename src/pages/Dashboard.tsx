
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, List, BarChart, Settings } from 'lucide-react';
import Layout from '@/components/Layout';
import ExpenseForm from '@/components/ExpenseForm';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import CategoryBreakdownChart from '@/components/charts/CategoryBreakdownChart';
import TimelineChart from '@/components/charts/TimelineChart';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { getCategoriesForType } from '@/lib/categories-data';
import { Link } from 'react-router-dom';
import { TimePeriod, TransactionType } from '@/types/transaction';
import DashboardContent from '@/components/dashboard/DashboardContent';

const Dashboard = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const { transactions, addTransaction, getTransactionsSummary, getTransactionsByCategory, getTransactionsByTimePeriod } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      setCategories(getCategoriesForType('expense'));
    }
  }, [user]);

  const handleAddExpense = (data: any) => {
    // Make sure to assign a valid TransactionType
    const transactionType: TransactionType = data.amount >= 0 ? 'income' : 'expense';
    
    const newTransaction = {
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: data.date,
      type: transactionType,
      notes: data.notes,
      source: 'manual' as const,
      fromAccount: 'Main Account'
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
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-muted rounded-lg"></div>
              <div className="h-80 bg-muted rounded-lg"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                {user ? `Welcome back${user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!` : 'Dashboard'}
              </h1>
              <div className="flex gap-2">
                <Button onClick={() => setIsAddingExpense(true)}>
                  <Plus className="mr-2" size={16} /> Add Transaction
                </Button>
                <Button variant="outline" onClick={() => navigate('/import-transactions')}>
                  Import Transactions
                </Button>
              </div>
            </div>

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

            <DashboardContent 
              transactions={transactions}
              filter={filter}
              setFilter={setFilter}
              setIsAddingExpense={setIsAddingExpense}
              isLoading={false}
            />
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
