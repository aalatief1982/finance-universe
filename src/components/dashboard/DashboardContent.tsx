
import React from 'react';
import DashboardStats from '@/components/DashboardStats';
import ExpenseChart from '@/components/ExpenseChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Transaction } from '@/types/transaction';
import { generateChartData } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { AnalyticsService } from '@/services/AnalyticsService';

interface DashboardContentProps {
  transactions: Transaction[];
  filter: 'all' | 'income' | 'expense';
  setFilter: (filter: 'all' | 'income' | 'expense') => void;
  setIsAddingExpense: (value: boolean) => void;
  isLoading?: boolean;
}

const DashboardContent = ({ 
  transactions, 
  filter, 
  setFilter,
  setIsAddingExpense,
  isLoading = false
}: DashboardContentProps) => {
  const { user } = useUser();
  
  // Defensive check for transactions array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  
  // Calculate financial summary with safer approach
  const income = safeTransactions
    .filter(t => t && typeof t.amount === 'number' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = safeTransactions
    .filter(t => t && typeof t.amount === 'number' && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const balance = income - expenses;

  // Calculate previous month's balance with defensive approach
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const lastMonthTransactions = safeTransactions.filter(tx => {
    // Skip invalid transactions
    if (!tx || !tx.date) return false;
    
    try {
      const txDate = new Date(tx.date);
      return txDate < firstDayOfMonth;
    } catch (error) {
      console.warn('Invalid date format in transaction:', tx);
      return false;
    }
  });

  const previousIncome = lastMonthTransactions
    .filter(t => t && typeof t.amount === 'number' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const previousExpenses = lastMonthTransactions
    .filter(t => t && typeof t.amount === 'number' && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const previousBalance = previousIncome - previousExpenses;

  // Generate chart data with error handling
  let categoryData = [];
  let subcategoryData = [];
  
  try {
    const chartData = generateChartData(safeTransactions);
    categoryData = chartData.categoryData || [];
    subcategoryData = AnalyticsService.getSubcategoryData(safeTransactions).slice(0, 10);
  } catch (error) {
    console.error('Error generating chart data:', error);
    // Provide empty arrays as fallback
    categoryData = [];
    subcategoryData = [];
  }

  // Placeholder skeleton for loading state
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-muted rounded-lg"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-muted rounded-lg"></div>
          <div className="h-72 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="pb-2">
        <h2 className="text-xl font-bold">
          {user?.fullName ? `Hi, ${user.fullName.split(' ')[0]}` : 'Welcome to your Dashboard'}
        </h2>
        <p className="text-muted-foreground text-sm">
          Here's an overview of your finances
        </p>
      </div>
      
      <DashboardStats 
        income={income} 
        expenses={expenses} 
        balance={balance}
        previousBalance={previousBalance}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ExpenseChart
            expensesByCategory={categoryData}
            expensesBySubcategory={subcategoryData}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <RecentTransactions 
            filter={filter}
            setFilter={setFilter}
            transactions={safeTransactions}
            setIsAddingExpense={setIsAddingExpense}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardContent;
