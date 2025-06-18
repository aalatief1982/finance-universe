import React from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import { useTransactions } from '@/context/TransactionContext';
import {
  ToggleGroup,
  ToggleGroupItem
} from '@/components/ui/toggle-group';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { AnalyticsService } from '@/services/AnalyticsService';
import { transactionService } from '@/services/TransactionService';
import { formatCurrency } from '@/lib/formatters';
import { toast } from '@/components/ui/use-toast';

const tips = [
  'Review your subscriptions regularly to avoid surprises.',
  'Small daily savings add up over time.',
  'Use categories to see where your money goes most.'
];

const Analytics: React.FC = () => {
  const { transactions } = useTransactions();

  type Range = '' | 'day' | 'week' | 'month' | 'year' | 'custom';
  const [range, setRange] = React.useState<Range>('month');
  const [customStart, setCustomStart] = React.useState<Date | null>(null);
  const [customEnd, setCustomEnd] = React.useState<Date | null>(null);

  const filteredTransactions = React.useMemo(() => {
    if (!range) return transactions;

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

  const budgetData = React.useMemo(() => {
    const categories = transactionService.getCategories().filter(c => c.metadata?.budget);
    return categories.map(cat => {
      const spent = filteredTransactions
        .filter(t => t.category === cat.name && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const budget = cat.metadata?.budget || 0;
      const percentUsed = budget ? (spent / budget) * 100 : 0;
      return {
        name: cat.name,
        budget,
        spent,
        percentUsed
      };
    });
  }, [filteredTransactions]);

  const topCategories = React.useMemo(() => {
    return AnalyticsService.getCategoryData(filteredTransactions).slice(0, 5);
  }, [filteredTransactions]);

  const monthlyBalance = React.useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};
    filteredTransactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      if (tx.amount >= 0) {
        grouped[key].income += tx.amount;
      } else {
        grouped[key].expense += Math.abs(tx.amount);
      }
    });
    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([key, val]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month, 1);
        return {
          date: date.toISOString(),
          balance: val.income - val.expense
        };
      });
  }, [filteredTransactions]);

  const uncategorizedCount = React.useMemo(
    () => filteredTransactions.filter(t => !t.category || t.category === 'Uncategorized').length,
    [filteredTransactions]
  );

  const randomTip = React.useMemo(() => tips[Math.floor(Math.random() * tips.length)], []);

  const handleExport = () => {
    const data = localStorage.getItem('transactions');
    if (!data) {
      toast({ title: 'No data to export' });
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported transactions' });
  };

  return (
    <Layout withPadding={false} fullWidth>
      <div className="px-1">
        <PageHeader title="Analytics" />

        <div className="my-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={val => setRange(val as Range)}
            className="w-full bg-muted p-1 text-muted-foreground rounded-md"
          >
            {['day', 'week', 'month', 'year'].map(r => (
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

        <div className="space-y-4 pb-20">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetData.length ? (
                <div className="space-y-3">
                  {budgetData.map(b => (
                    <div key={b.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{b.name}</span>
                        <span>{formatCurrency(b.spent)} / {formatCurrency(b.budget)}</span>
                      </div>
                      <Progress value={Math.min(100, b.percentUsed)} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No budget data configured.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {topCategories.length ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCategories} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => formatCurrency(v).replace(/[^0-9.]/g, '')} width={40} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v:number)=>formatCurrency(Number(v))} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No expense data.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Monthly Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyBalance.length ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyBalance} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tickFormatter={d=>new Date(d).toLocaleDateString('default',{month:'short'})} tick={{fontSize:11}} />
                      <YAxis tickFormatter={v => formatCurrency(v).replace(/[^0-9.]/g,'')} width={40} tick={{fontSize:11}} />
                      <Tooltip formatter={(v:number)=>formatCurrency(Number(v))} labelFormatter={d=>new Date(d).toLocaleDateString('default',{month:'short',year:'2-digit'})} />
                      <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r:2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No data for this range.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goal Progress Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-6">No goals configured.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recurring Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-6">Recurring transaction insights coming soon.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uncategorized Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {uncategorizedCount > 0 ? (
                <p className="text-sm text-muted-foreground">You have {uncategorizedCount} uncategorized transactions.</p>
              ) : (
                <p className="text-sm text-muted-foreground">All transactions are categorized.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{randomTip}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Report</CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={handleExport}
                className="text-sm text-primary underline"
              >
                Download transactions JSON
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
