
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

const Dashboard = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const { addTransaction, transactions, getTransactionsSummary, getTransactionsByCategory, getTransactionsByTimePeriod } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  const [chartType, setChartType] = useState('category');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [categories, setCategories] = useState([]);

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

  const transactionsSummary = getTransactionsSummary();
  const transactionsByCategory = getTransactionsByCategory();
  const transactionsByTimePeriod = getTransactionsByTimePeriod(timePeriod);

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
            {user ? `Welcome back${user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!` : 'Dashboard'}
          </h1>
          <Button onClick={() => setIsAddingExpense(true)}>
            <Plus className="mr-2" size={16} /> Add Transaction
          </Button>
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

        <TransactionSummary summary={transactionsSummary} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBreakdownChart data={transactionsByCategory} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Timeline</CardTitle>
                <select 
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <TimelineChart data={transactionsByTimePeriod} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/transactions">
                  <List className="mr-2" size={16} /> View All
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/import-transactions">
                  <BarChart className="mr-2" size={16} /> Import
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="mr-2" size={16} /> Settings
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <TransactionList transactions={transactions} />
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
