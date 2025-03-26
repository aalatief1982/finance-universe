
import React from 'react';
import DashboardStats from '@/components/DashboardStats';
import ExpenseChart from '@/components/ExpenseChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Transaction } from '@/types/transaction';
import { generateChartData } from '@/lib/mock-data';

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
    <>
      <DashboardStats 
        income={income} 
        expenses={expenses} 
        balance={balance} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart 
          expensesByCategory={categoryData}
          expensesByDate={timelineData}
        />
        
        <RecentTransactions 
          filter={filter}
          setFilter={setFilter}
          transactions={transactions}
          setIsAddingExpense={setIsAddingExpense}
        />
      </div>
    </>
  );
};

export default DashboardContent;
