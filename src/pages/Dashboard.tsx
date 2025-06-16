
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const Dashboard = () => {
  const { transactions, addTransaction } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  type Range = '' | 'day' | 'week' | 'month' | 'year';
  const [range, setRange] = React.useState<Range>('');

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

  const filteredTransactions = React.useMemo(() => {
    if (!range) {
      return transactions;
    }

    const now = new Date();
    let start = new Date(now);

    switch (range) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= now;
    });
  }, [transactions, range]);

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

  return (
    <Layout>
      <div className="px-4">
        <PageHeader
          title={user?.fullName ? `Hi, ${user.fullName.split(' ')[0]}` : 'Dashboard'}
          description="Here's an overview of your finances"
          actions={
            <Button onClick={handleAddTransaction} className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Transaction
            </Button>
          }
        />

        <div className="my-4">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(val) => setRange(val as Range)}
            className="w-full justify-between gap-2"
          >
            <ToggleGroupItem
              value="day"
              className="flex-1 data-[state=on]:bg-[#0097a0] data-[state=on]:text-white"
            >
              Day
            </ToggleGroupItem>
            <ToggleGroupItem
              value="week"
              className="flex-1 data-[state=on]:bg-[#0097a0] data-[state=on]:text-white"
            >
              Week
            </ToggleGroupItem>
            <ToggleGroupItem
              value="month"
              className="flex-1 data-[state=on]:bg-[#0097a0] data-[state=on]:text-white"
            >
              Month
            </ToggleGroupItem>
            <ToggleGroupItem
              value="year"
              className="flex-1 data-[state=on]:bg-[#0097a0] data-[state=on]:text-white"
            >
              Year
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-[var(--section-gap)]">
          <DashboardStats
            income={summary.income}
            expenses={summary.expenses}
            balance={summary.balance}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--card-gap)]">
            <div className="bg-card p-2 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Expense Breakdown</h2>
              <ExpenseChart
                expensesByCategory={expensesByCategory}
                expensesByDate={expensesByDate}
              />
            </div>

            <div className="bg-card p-2 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/transactions')}
                >
                  View All
                </Button>
              </div>

              {filteredTransactions.length > 0 ? (
                <div className="space-y-2">
                  {filteredTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-2 bg-secondary/50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{transaction.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.category} • {transaction.date}
                        </p>
                      </div>
                      <p className={transaction.amount < 0 ? "text-destructive" : "text-[hsl(var(--income))]"}>
                        {transaction.amount < 0 ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No transactions yet</p>
                  <Button onClick={handleAddSampleTransaction}>Add Sample Transactions</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
