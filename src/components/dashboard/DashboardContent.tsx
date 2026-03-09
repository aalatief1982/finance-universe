import React from 'react';
import DashboardStats from '@/components/DashboardStats';
import ExpenseChart from '@/components/ExpenseChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Transaction } from '@/types/transaction';
import { generateChartData } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { AnalyticsService } from '@/services/AnalyticsService';
import { useLanguage } from '@/i18n/LanguageContext';

interface DashboardContentProps {
  transactions: Transaction[];
  filter: 'all' | 'income' | 'expense';
  setFilter: (filter: 'all' | 'income' | 'expense') => void;
  setIsAddingExpense: (value: boolean) => void;
  isLoading?: boolean;
}

const DashboardContent = ({ transactions, filter, setFilter, setIsAddingExpense, isLoading = false }: DashboardContentProps) => {
  const { user } = useUser();
  const { t } = useLanguage();
  const safeTransactions = React.useMemo(() => (Array.isArray(transactions) ? transactions : []), [transactions]);

  const baseCurrency = user?.preferences?.currency || 'SAR';
  const fxSummary = React.useMemo(() => AnalyticsService.getFxAwareTotals(safeTransactions, baseCurrency), [safeTransactions, baseCurrency]);
  const income = fxSummary.income;
  const expenses = fxSummary.expenses;
  const balance = income - expenses;

  const lastMonthTransactions = React.useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return safeTransactions.filter(tx => {
      if (!tx || !tx.date) return false;
      try { return new Date(tx.date) < firstDayOfMonth; }
      catch { return false; }
    });
  }, [safeTransactions]);

  const previousFxSummary = React.useMemo(() => AnalyticsService.getFxAwareTotals(lastMonthTransactions, baseCurrency), [lastMonthTransactions, baseCurrency]);
  const previousBalance = previousFxSummary.income - previousFxSummary.expenses;

  let categoryData: any[] = [];
  let subcategoryData: any[] = [];
  try {
    const chartData = generateChartData(safeTransactions);
    categoryData = AnalyticsService.getFxAwareCategoryData(safeTransactions, baseCurrency) || chartData.categoryData || [];
    subcategoryData = AnalyticsService.getFxAwareSubcategoryData(safeTransactions, baseCurrency).slice(0, 10);
  } catch { categoryData = []; subcategoryData = []; }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map(i => (<div key={i} className="h-28 bg-muted rounded-lg"></div>))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-muted rounded-lg"></div>
          <div className="h-72 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  const firstName = user?.fullName?.split(' ')[0];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div className="pb-2">
        <h2 className="text-xl font-bold">
          {firstName ? `${t('dashboard.hi')}, ${firstName}` : t('dashboard.welcomeDashboard')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('dashboard.financesOverview')}</p>
      </div>
      
      <DashboardStats income={income} expenses={expenses} balance={balance} previousBalance={previousBalance} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <ExpenseChart expensesByCategory={categoryData} expensesBySubcategory={subcategoryData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <RecentTransactions filter={filter} setFilter={setFilter} transactions={safeTransactions} setIsAddingExpense={setIsAddingExpense} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardContent;
