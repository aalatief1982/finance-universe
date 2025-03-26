
import React from 'react';
import DashboardStats from '@/components/DashboardStats';
import ExpenseChart from '@/components/ExpenseChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Transaction } from '@/types/transaction';
import { generateChartData } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';

interface DashboardContentProps {
  transactions: Transaction[];
  filter: 'all' | 'income' | 'expense';
  setFilter: (filter: 'all' | 'income' | 'expense') => void;
  setIsAddingExpense: (value: boolean) => void;
}

const DashboardContent = ({ 
  transactions, 
  filter, 
  setFilter,
  setIsAddingExpense
}: DashboardContentProps) => {
  const { user } = useUser();
  
  // Calculate financial summary
  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income + expenses;

  // Generate chart data - casting to ensure type compatibility
  const { categoryData, timelineData } = generateChartData(transactions as any);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="pb-2">
        <h2 className="text-xl font-bold">
          {user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Welcome to your Dashboard'}
        </h2>
        <p className="text-muted-foreground">
          Here's an overview of your finances
        </p>
      </div>
      
      <DashboardStats 
        income={income} 
        expenses={expenses} 
        balance={balance} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-lg border p-4"
        >
          <h3 className="font-medium mb-3">Expense Breakdown</h3>
          <ExpenseChart 
            expensesByCategory={categoryData}
            expensesByDate={timelineData}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-lg border p-4"
        >
          <RecentTransactions 
            filter={filter}
            setFilter={setFilter}
            transactions={transactions}
            setIsAddingExpense={setIsAddingExpense}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardContent;
