import React from 'react';
import Layout from '@/components/Layout';
import DashboardStats from '@/components/DashboardStats';
import ExpenseChart from '@/components/ExpenseChart';
import { useTransactions } from '@/context/TransactionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { useUser } from '@/context/UserContext';
import TimelineChart from '@/components/charts/TimelineChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import SubcategoryBarChart from '@/components/charts/SubcategoryBarChart';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { transactions, addTransaction } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = React.useState<'all' | 'day' | 'week' | 'month' | 'year'>('month');

  const handleAddTransaction = () => {
    navigate('/edit-transaction');
  };

  const handleAddSampleTransaction = () => {
    const sampleTransaction: Transaction = {
      id: uuidv4(),
      title: 'Sample Transaction',
      amount: -25.99,
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      notes: 'Sample transaction for testing',
      source: 'manual',
      fromAccount: 'Cash'
    };
    addTransaction(sampleTransaction);
  };

  const timePeriodOptions = [
    { value: 'all', label: 'All' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Filter transactions based on selected time period
  const getFilteredTransactions = () => {
    const now = new Date();
    const startDate = new Date();

    switch (timePeriod) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth(), 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear(), 0, 1);
        break;
      default:
        return transactions; // 'all' case - return all transactions
    }

    return transactions.filter(transaction => {
      const txDate = new Date(transaction.date);
      return txDate >= startDate && txDate <= now;
    });
  };

  // Get filtered transactions
  const filteredTransactions = getFilteredTransactions();

  // Calculate summary from filtered transactions
  const summary = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.amount > 0) {
        acc.income += transaction.amount;
      } else {
        acc.expenses += Math.abs(transaction.amount);
      }
      acc.balance += transaction.amount;
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );

  // Calculate category data from filtered transactions
  const categoryData = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((acc, transaction) => {
      const { category, amount } = transaction;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(amount);
      return acc;
    }, {} as Record<string, number>);

  const timelineData = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((acc, transaction) => {
      const date = transaction.date.slice(0, 10);
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

  const expensesByCategory = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }));

  const expensesByDate = Object.entries(timelineData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // Prepare data for new charts
  const trendsData = Object.entries(
    filteredTransactions.reduce((acc, transaction) => {
      const date = transaction.date.slice(0, 7); // Year-Month
      if (!acc[date]) {
        acc[date] = { income: 0, expenses: 0 };
      }
      if (transaction.amount > 0) {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expenses += Math.abs(transaction.amount);
      }
      return acc;
    }, {} as Record<string, { income: number, expenses: number }>)
  ).map(([date, values]) => ({
    date,
    ...values
  })).sort((a, b) => a.date.localeCompare(b.date));

const topCategories = expensesByCategory
  .sort((a, b) => b.value - a.value)
  .map((item, index) => ({
    id: `${item.name}-${index}`,        // 🔑 unique ID
    category: item.name,
    amount: item.value
  }));

const topSubcategories = expensesByDate
  .sort((a, b) => b.amount - a.amount)
  .map((item, index) => ({
    id: `${item.date}-${index}`,        // 🔑 unique ID
    subcategory: item.date,
    amount: item.amount
  }));

  return (
    <Layout withPadding={false}>
      <div className="px-1 space-y-3">
        {/* Greeting */}
        <div className="pt-2">
          <h1 className="text-lg font-semibold">
            {user?.fullName ? `Hi, ${user.fullName.split(' ')[0]}` : 'Welcome'}
          </h1>
          <p className="text-sm text-muted-foreground">Here's your financial summary</p>
        </div>

        {/* Time Period Selection */}
        <div className="flex gap-1">
          {timePeriodOptions.map((option) => (
            <Button
              key={option.value}
              variant={timePeriod === option.value ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setTimePeriod(option.value as 'all' | 'day' | 'week' | 'month' | 'year')}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 gap-2">
          <DashboardStats
            income={summary.income}
            expenses={summary.expenses}
            balance={summary.balance}
          />
        </div>

        {/* Charts Section */}
        <div className="space-y-3">
          {/* Trends Chart */}
          <div className="bg-background">
            <h2 className="text-sm font-medium mb-2">Expense & Income Trends</h2>
            <TimelineChart data={trendsData} />
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Top Categories */}
            <div className="bg-background">
              <h2 className="text-sm font-medium mb-2">Top Categories</h2>
              <CategoryPieChart 
                data={topCategories} 
                onCategoryClick={(category) => navigate(`/transactions?category=${category}`)}
              />
            </div>

            {/* Top Subcategories */}
            <div className="bg-background">
              <h2 className="text-sm font-medium mb-2">Top Subcategories</h2>
              <SubcategoryBarChart 
                data={topSubcategories} 
                onSubcategoryClick={(subcategory) => navigate(`/transactions?subcategory=${subcategory}`)}
              />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-background">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium">Recent Transactions</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/transactions')}
                className="text-xs"
              >
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {filteredTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{transaction.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.category} • {transaction.date}
                    </p>
                  </div>
                  <p className={cn(
                    "text-sm font-medium",
                    transaction.amount < 0 ? "text-red-500" : "text-green-500"
                  )}>
                    {transaction.amount < 0 ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>        {/* Floating Action Button */}
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 z-50"
          onClick={handleAddTransaction}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Transaction</span>
        </Button>
      </div>
    </Layout>
  );
};

export default Dashboard;
