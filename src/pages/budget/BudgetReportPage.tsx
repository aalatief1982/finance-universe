import React from 'react';
import { BudgetLayout } from '@/components/budget/BudgetLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTransactions } from '@/context/TransactionContext';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { Budget, BudgetPeriod } from '@/models/budget';
import { formatCurrency } from '@/utils/format-utils';
import { formatPeriodLabel } from '@/utils/budget-period-utils';
import { useBudgetPeriodParams } from '@/hooks/useBudgetPeriodParams';
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { 
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

const BudgetReportPage = () => {
  const { transactions } = useTransactions();
  const { period, year, periodIndex, periodLabel } = useBudgetPeriodParams();
  const [timeRange, setTimeRange] = React.useState<'3m' | '6m' | '12m'>('6m');
  
  const budgets = React.useMemo(() => budgetService.getBudgets(), []);
  const accounts = React.useMemo(() => accountService.getAccounts(), []);
  const categories = React.useMemo(() => transactionService.getCategories(), []);

  // Use selected period or default to monthly
  const selectedPeriod: BudgetPeriod = period === 'all' ? 'monthly' : period;

  // Get display name with specific period instance
  const getBudgetDisplayName = (b: Budget) => {
    const periodName = formatPeriodLabel(b.period, b.year, b.periodIndex);
    
    if (b.scope === 'overall') {
      return periodName;
    }
    
    const all = [...accounts, ...categories];
    const t = all.find((a: any) => a.id === b.targetId);
    const scopeName = t ? (t as any).name : b.targetId;
    
    return `${scopeName} • ${periodName}`;
  };

  // Calculate budget vs actual data - filter by period type and year (show all periods in year for overview)
  const budgetVsActual = React.useMemo(() => {
    return budgets
      .filter(b => {
        // Filter by period type
        if (b.period !== selectedPeriod) return false;
        
        // For "all" view, show all budgets of that period type
        if (period === 'all') return true;
        
        // Filter by year only (not periodIndex) to show all periods in the year
        if (b.year !== year) return false;
        
        return true;
      })
      .map(budget => {
        const progress = budgetService.getBudgetProgress(budget);
        return {
          id: budget.id,
          name: getBudgetDisplayName(budget),
          budget: budget.amount,
          spent: progress.spent,
          remaining: Math.max(0, progress.remaining),
          percentUsed: Math.round(progress.percentUsed),
          periodIndex: budget.periodIndex, // Keep for sorting
        };
      })
      .sort((a, b) => (a.periodIndex ?? 0) - (b.periodIndex ?? 0)); // Sort chronologically
  }, [budgets, selectedPeriod, period, year]);

  // Total summary
  const totalSummary = React.useMemo(() => {
    const totalBudget = budgetVsActual.reduce((sum, b) => sum + b.budget, 0);
    const totalSpent = budgetVsActual.reduce((sum, b) => sum + b.spent, 0);
    const overBudget = budgetVsActual.filter(b => b.percentUsed > 100).length;
    
    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      percentUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      overBudgetCount: overBudget,
    };
  }, [budgetVsActual]);

  // Trend data
  const trendData = React.useMemo(() => {
    const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    const now = new Date();
    const startDate = subMonths(now, months - 1);
    
    const monthRange = eachMonthOfInterval({ start: startDate, end: now });
    
    return monthRange.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSpending = transactions
        .filter(tx => {
          const txDate = typeof tx.date === 'string' ? parseISO(tx.date) : tx.date;
          return isWithinInterval(txDate, { start: monthStart, end: monthEnd }) &&
            (tx.type === 'expense' || tx.amount < 0);
        })
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      const monthBudget = budgets
        .filter(b => b.period === 'monthly')
        .reduce((sum, b) => sum + b.amount, 0);
      
      return {
        month: format(month, 'MMM'),
        fullMonth: format(month, 'MMMM yyyy'),
        spent: monthSpending,
        budget: monthBudget,
      };
    });
  }, [transactions, budgets, timeRange]);

  // Category breakdown for pie chart
  const categoryBreakdown = React.useMemo(() => {
    const categoryBudgets = budgets.filter(b => b.scope === 'category');
    
    return categoryBudgets.map((budget, index) => {
      const progress = budgetService.getBudgetProgress(budget);
      return {
        name: getBudgetDisplayName(budget),
        value: progress.spent,
        budget: budget.amount,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      };
    }).filter(c => c.value > 0);
  }, [budgets]);

  // Over-budget items
  const overBudgetItems = React.useMemo(() => {
    return budgetVsActual
      .filter(b => b.percentUsed > 100)
      .map(b => ({
        name: b.name,
        over: b.spent - b.budget,
        percentOver: b.percentUsed - 100,
      }));
  }, [budgetVsActual]);

  // Export to CSV
  const handleExport = () => {
    const headers = ['Category', 'Budget', 'Spent', 'Remaining', '% Used'];
    const rows = budgetVsActual.map(b => [
      b.name,
      b.budget.toFixed(2),
      b.spent.toFixed(2),
      b.remaining.toFixed(2),
      `${b.percentUsed}%`,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{payload[0]?.payload?.fullMonth || label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="font-medium">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const headerActions = (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );

  return (
    <BudgetLayout 
      title="Reports" 
      description="Analyze your budget performance"
      showAddButton={false}
      headerActions={headerActions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Budget</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(totalSummary.totalBudget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(totalSummary.totalSpent)}
            </div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              totalSummary.percentUsed > 100 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {totalSummary.percentUsed > 100 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.round(totalSummary.percentUsed)}% of budget
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Over Budget Alert */}
      {overBudgetItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">
              Over Budget ({overBudgetItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overBudgetItems.map(item => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="text-sm">{item.name}</span>
                <Badge variant="destructive">
                  +{formatCurrency(item.over)} ({Math.round(item.percentOver)}%)
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts Tabs */}
      <Tabs defaultValue="comparison" className="space-y-4 mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>

        {/* Budget vs Spent Comparison */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Budget vs. Spent</CardTitle>
              <CardDescription>Compare budgeted amounts to actual spending</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetVsActual.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={budgetVsActual} 
                      layout="vertical"
                      margin={{ top: 10, right: 10, left: 60, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={v => formatCurrency(v)} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="hsl(var(--primary))" />
                      <Bar dataKey="spent" name="Spent" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No {selectedPeriod} budgets found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Breakdown Pie Chart */}
        <TabsContent value="breakdown">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spending by Category</CardTitle>
              <CardDescription>Distribution of spending across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No category spending data
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spending Trend Line Chart */}
        <TabsContent value="trend">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Spending Trend</CardTitle>
                  <CardDescription>Monthly spending over time</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={v => setTimeRange(v as '3m' | '6m' | '12m')}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3m">3M</SelectItem>
                    <SelectItem value="6m">6M</SelectItem>
                    <SelectItem value="12m">12M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={v => formatCurrency(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="spent" 
                      name="Spent"
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="budget" 
                      name="Budget"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Category</th>
                  <th className="text-right py-2 font-medium">Budget</th>
                  <th className="text-right py-2 font-medium">Spent</th>
                  <th className="text-right py-2 font-medium">% Used</th>
                </tr>
              </thead>
              <tbody>
                {budgetVsActual.map(item => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-right">{formatCurrency(item.budget)}</td>
                    <td className="py-2 text-right">{formatCurrency(item.spent)}</td>
                    <td className="py-2 text-right">
                      <Badge 
                        variant={item.percentUsed > 100 ? 'destructive' : item.percentUsed > 80 ? 'secondary' : 'outline'}
                      >
                        {item.percentUsed}%
                      </Badge>
                    </td>
                  </tr>
                ))}
                {budgetVsActual.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No budget data for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </BudgetLayout>
  );
};

export default BudgetReportPage;
