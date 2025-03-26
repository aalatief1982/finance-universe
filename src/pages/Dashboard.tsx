
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import DashboardStats from '@/components/DashboardStats';
import ExpenseChart from '@/components/ExpenseChart';
import ExpenseCard from '@/components/ExpenseCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { CATEGORIES, INITIAL_TRANSACTIONS, Transaction, generateChartData } from '@/lib/mock-data';
import { formatDate } from '@/lib/formatters';
import { Plus, MessageSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load transactions from localStorage or use initial data
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
    }
  }, []);

  useEffect(() => {
    // Save transactions to localStorage whenever they change
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  const { categoryData, timelineData } = generateChartData(transactions);

  const calculateStats = () => {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income + expenses;

    return { income, expenses, balance };
  };

  const { income, expenses, balance } = calculateStats();

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

  // Get recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <>
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="gap-1 hidden sm:flex"
                asChild
              >
                <Link to="/process-sms">
                  <MessageSquare size={18} />
                  Import SMS
                </Link>
              </Button>
              
              <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus size={18} />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <ExpenseForm 
                    onSubmit={handleAddTransaction} 
                    categories={CATEGORIES}
                    onCancel={() => setIsAddingExpense(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <DashboardStats 
            income={income} 
            expenses={expenses} 
            balance={balance} 
          />
          
          <div className="sm:hidden">
            <Button 
              variant="outline" 
              className="w-full gap-1 mb-4"
              asChild
            >
              <Link to="/process-sms">
                <MessageSquare size={18} />
                Import Transactions from SMS
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart 
              expensesByCategory={categoryData}
              expensesByDate={timelineData}
            />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Transactions</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/transactions">View All</Link>
                </Button>
              </div>
              
              <div className="space-y-3">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <ExpenseCard
                      key={transaction.id}
                      id={transaction.id}
                      title={transaction.title}
                      amount={transaction.amount}
                      category={transaction.category}
                      date={formatDate(transaction.date)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 border rounded-lg flex flex-col items-center">
                    <p className="text-muted-foreground mb-3">No transactions yet</p>
                    <div className="flex space-x-2">
                      <Button size="sm" asChild>
                        <Link to="/process-sms">
                          <MessageSquare className="mr-1" size={16} />
                          Import from SMS
                        </Link>
                      </Button>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="mr-1" size={16} />
                          Add Manually
                        </Button>
                      </DialogTrigger>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Layout>
    </>
  );
};

export default Dashboard;
