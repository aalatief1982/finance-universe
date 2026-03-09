import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { format, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { Budget } from '@/models/budget';
import { BudgetProgress } from '@/models/budget-period';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/format-utils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface SpendingTrendChartProps {
  budget: Budget;
  progress: BudgetProgress;
  transactions: Transaction[];
  className?: string;
}

interface SpendingTrendPoint {
  date: string;
  shortDate: string;
  spent: number | null;
  ideal: number;
  budget: number;
  dayExpense: number | null;
}

export function SpendingTrendChart({
  budget,
  progress,
  transactions,
  className,
}: SpendingTrendChartProps) {
  const { t } = useLanguage();

  const chartData = React.useMemo(() => {
    const { periodStart, periodEnd } = progress;
    const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
    
    let cumulativeSpent = 0;
    
    return days.map((day, index) => {
      const dayExpenses = transactions
        .filter(tx => {
          const txDate = typeof tx.date === 'string' ? parseISO(tx.date) : tx.date;
          return isSameDay(txDate, day) && (tx.type === 'expense' || tx.amount < 0);
        })
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      cumulativeSpent += dayExpenses;
      const idealPace = (budget.amount / days.length) * (index + 1);
      const isInFuture = day > new Date();
      
      return {
        date: format(day, 'MMM d'),
        shortDate: format(day, 'd'),
        spent: isInFuture ? null : cumulativeSpent,
        ideal: idealPace,
        budget: budget.amount,
        dayExpense: isInFuture ? null : dayExpenses,
      };
    });
  }, [budget, progress, transactions]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    
    const rawPayload = payload[0]?.payload;
    const data: SpendingTrendPoint | undefined = rawPayload && typeof rawPayload === 'object' ? rawPayload as unknown as SpendingTrendPoint : undefined;
    if (!data) return null;
    
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        {data.spent !== null && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t('trendChart.spent')}</span>
            <span className="font-medium text-destructive">
              {formatCurrency(data.spent, budget.currency)}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t('trendChart.target')}</span>
          <span className="font-medium text-primary">
            {formatCurrency(data.ideal, budget.currency)}
          </span>
        </div>
        {data.dayExpense !== null && data.dayExpense > 0 && (
          <div className="flex justify-between gap-4 mt-1 pt-1 border-t">
            <span className="text-muted-foreground">{t('trendChart.day')}</span>
            <span className="font-medium">
              {formatCurrency(data.dayExpense, budget.currency)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("h-64", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5}
          />
          <XAxis 
            dataKey="shortDate" 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tickFormatter={v => formatCurrency(v, budget.currency)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Line
            type="monotone"
            dataKey="budget"
            stroke="hsl(var(--destructive))"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name={t('trendChart.budgetLimit')}
          />
          
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name={t('trendChart.targetPace')}
          />
          
          <Line
            type="monotone"
            dataKey="spent"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={false}
            name={t('trendChart.actualSpending')}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SpendingTrendChart;
