
import React from 'react';
import Layout from '@/components/Layout';
import DashboardStats from '@/components/DashboardStats';
import TimelineChart from '@/components/charts/TimelineChart';
import NetBalanceChart from '@/components/charts/NetBalanceChart';
import CategoryChart from '@/components/charts/CategoryChart';
import SubcategoryChart from '@/components/charts/SubcategoryChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions } from '@/context/TransactionContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  CircleDollarSign,
  Receipt,
  GraduationCap,
  Gamepad2,
  Lightbulb,
  Package,
  Gift,
  Baby,
  Bath,
  ConciergeBell,
  ArrowLeftRight,
  Plane,
  HeartPulse,
} from 'lucide-react';
import { format } from 'date-fns';

import ResponsiveFAB from '@/components/dashboard/ResponsiveFAB';
import AvatarGreeting from '@/components/dashboard/AvatarGreeting';
import PageHeader from '@/components/layout/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { useUser } from '@/context/UserContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AnalyticsService } from '@/services/AnalyticsService';
import { DatePicker } from '@/components/ui/date-picker';

const Dashboard = () => {
  const { transactions, addTransaction } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();


  type Range = '' | 'day' | 'week' | 'month' | 'year' | 'custom';
  const [range, setRange] = React.useState<Range>('');
  const [customStart, setCustomStart] = React.useState<Date | null>(null);
  const [customEnd, setCustomEnd] = React.useState<Date | null>(null);
  const [activeTab, setActiveTab] = React.useState('trends');


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
    let end = new Date(now);


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
      case 'custom':
        if (customStart) start = new Date(customStart);
        if (customEnd) end = new Date(customEnd);
        break;
    }

    const toDate = range === 'custom' ? end : now;

    return transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= toDate;
    });
  }, [transactions, range, customStart, customEnd]);

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

  const iconMap: Record<string, JSX.Element> = {
    Bills: <Receipt className="w-6 h-6" />,
    Education: <GraduationCap className="w-6 h-6" />,
    Entertainment: <Gamepad2 className="w-6 h-6" />,
    Food: <Utensils className="w-6 h-6" />,
    'Gifts & Donations': <Gift className="w-6 h-6" />,
    Health: <HeartPulse className="w-6 h-6" />,
    Housing: <Home className="w-6 h-6" />,
    Kids: <Baby className="w-6 h-6" />,
    'Personal Care': <Bath className="w-6 h-6" />,
    Services: <ConciergeBell className="w-6 h-6" />,
    Shopping: <ShoppingBag className="w-6 h-6" />,
    Transfer: <ArrowLeftRight className="w-6 h-6" />,
    Transportation: <Car className="w-6 h-6" />,
    Travel: <Plane className="w-6 h-6" />,
    Utilities: <Lightbulb className="w-6 h-6" />,
    Income: <CircleDollarSign className="w-6 h-6" />,
    Other: <Package className="w-6 h-6" />,
  };

  const formatDisplayTitle = (txn: Transaction) => {
    const base = txn.title?.trim() || 'Transaction';
    return txn.type === 'expense' ? `${base} (Expense)` : base;
  };

  const formatTxnDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEE, MMM dd');
    } catch {
      return '—';
    }
  };

  const expensesBySubcategory = AnalyticsService.getSubcategoryData(filteredTransactions).slice(0, 10);

  const expensesByCategory = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }));

  const timelineData = React.useMemo(() => {
    const grouped = new Map<number, { income: number; expense: number }>();
    filteredTransactions.forEach(tx => {
      const d = new Date(tx.date);
      const bucket = range === 'year' ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = bucket.getTime();
      const existing = grouped.get(key) || { income: 0, expense: 0 };
      if (tx.amount > 0) {
        existing.income += tx.amount;
      } else {
        existing.expense += Math.abs(tx.amount);
      }
      grouped.set(key, existing);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, val]) => ({
        date: new Date(ts).toISOString(),
        income: val.income,
        expense: val.expense,
        balance: val.income - val.expense,
      }));
  }, [filteredTransactions, range]);

  return (
    <Layout withPadding={false} fullWidth>
      <div className="px-1">
        <PageHeader
          title={<AvatarGreeting user={user} />}
        />

        <div className="my-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(val) => setRange(val as Range)}
            className="w-full bg-muted p-1 text-muted-foreground rounded-md"
          >
            {['day','week','month','year'].map((r) => (
              <ToggleGroupItem
                key={r}
                value={r}
                className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium"
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value="custom"
              className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium"
            >
              Custom
            </ToggleGroupItem>
          </ToggleGroup>
          {range === 'custom' && (
            <div className="mt-2 flex items-center gap-2 animate-in fade-in">
              <DatePicker date={customStart} setDate={setCustomStart} placeholder="Start" />
              <DatePicker date={customEnd} setDate={setCustomEnd} placeholder="End" />
            </div>
          )}
        </div>

        <div className="space-y-[calc(var(--section-gap)/2)]">
          <DashboardStats
            income={summary.income}
            expenses={summary.expenses}
            balance={summary.balance}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--card-gap)]">
            <div className="bg-card p-[var(--card-padding)] rounded-lg shadow">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 border-b">
                  <TabsTrigger value="trends" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">Trends</TabsTrigger>
                  <TabsTrigger value="net" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">Net Balance</TabsTrigger>
                  <TabsTrigger value="category" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">By Category</TabsTrigger>
                  <TabsTrigger value="subcategory" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">Subcategories</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-2">
                  <h2 className="text-lg font-semibold">Spending Trends</h2>
                  <TimelineChart data={timelineData} />
                </TabsContent>

                <TabsContent value="net" className="space-y-2">
                  <h2 className="text-lg font-semibold">Net Growth Summary</h2>
                  <NetBalanceChart data={timelineData} />
                </TabsContent>

                <TabsContent value="category" className="pt-2">
                  <CategoryChart data={expensesByCategory} />
                </TabsContent>

                <TabsContent value="subcategory" className="pt-2">
                  <SubcategoryChart data={expensesBySubcategory} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-card p-[var(--card-padding)] rounded-lg shadow flex flex-col justify-between">
              <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>

              {filteredTransactions.length > 0 ? (
                <div className="space-y-1 flex-1">
                  {filteredTransactions.slice(0, 5).map((transaction, idx) => (
                    <div
                      key={transaction.id || idx}
                      onClick={() => navigate(`/edit-transaction/${transaction.id}`)}
                      aria-label="Edit transaction"
                      className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {iconMap[transaction.category] || iconMap['Other']}
                          <span className="font-medium line-clamp-1">{formatDisplayTitle(transaction)}</span>
                        </div>
                        <div
                          className={transaction.amount < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}
                        >
                          {transaction.amount < 0 ? '−' : '+'}
                          {Math.abs(transaction.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTxnDate(transaction.date)} • {transaction.category}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">No transactions found for this period.</p>
              )}

              <div className="flex justify-start mt-3 mb-16">
                <button
                  onClick={() => navigate('/transactions')}
                  aria-label="View full transaction history"
                  className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          {/* TODO: Add <BudgetSummaryCard /> when data available */}
          {/* TODO: Add Goal progress card */}
          {/* TODO: Add Tip of the day card */}
        </div>
      </div>
      <ResponsiveFAB onClick={handleAddTransaction} />
    </Layout>
  );
};

export default Dashboard;
