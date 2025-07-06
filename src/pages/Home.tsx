
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
import { ChevronRight } from 'lucide-react';
import { CATEGORY_ICON_MAP } from '@/constants/categoryIconMap';
import { TYPE_ICON_MAP } from '@/constants/typeIconMap';
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

const Home = () => {
  const { transactions, addTransaction } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();


  type Range = '' | 'day' | 'week' | 'month' | 'year' | 'custom';
  const defaultEnd = React.useMemo(() => new Date(), []);
  const defaultStart = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);

  const [range, setRange] = React.useState<Range>('custom');
  const [customStart, setCustomStart] = React.useState<Date | null>(defaultStart);
  const [customEnd, setCustomEnd] = React.useState<Date | null>(defaultEnd);
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
      <div className="container px-1">
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
                className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value="custom"
              className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
            >
              Custom
            </ToggleGroupItem>
          </ToggleGroup>
          {range === 'custom' && (
            <div className="mt-2 flex items-center justify-center gap-2 animate-in fade-in">
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
                  <TabsTrigger value="category" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">Category</TabsTrigger>
                  <TabsTrigger value="subcategory" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">Subcategory</TabsTrigger>
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
                      onClick={() =>
                        navigate(`/edit-transaction/${transaction.id}`, {
                          state: { transaction },
                        })
                      }
                      aria-label="Edit transaction"
                      className="bg-card text-card-foreground dark:bg-black dark:text-white rounded-lg shadow-sm border px-4 py-3 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const CatIcon =
                              CATEGORY_ICON_MAP[transaction.category]?.icon ||
                              CATEGORY_ICON_MAP['Other'].icon;
                            const TypeIcon = TYPE_ICON_MAP[transaction.type].icon;
                            return (
                              <>
                                <CatIcon className="w-5 h-5" />
                                <TypeIcon className={`w-4 h-4 ${TYPE_ICON_MAP[transaction.type].color}`} />
                              </>
                            );
                          })()}
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

export default Home;
