import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { format, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { Budget } from '@/models/budget';
import { BudgetProgress } from '@/models/budget-period';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/format-utils';
import { cn } from '@/lib/utils';

interface SpendingTrendChartProps {
  budget: Budget;
  progress: BudgetProgress;
  transactions: Transaction[];
  className?: string;
}

export function SpendingTrendChart({
  budget,
  progress,
  transactions,
  className,
}: SpendingTrendChartProps) {
  // Generate daily data points
  const chartData = React.useMemo(() => {
    const { periodStart, periodEnd } = progress;
    const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
    
    let cumulativeSpent = 0;
    
    return days.map((day, index) => {
      // Sum expenses for this day
      const dayExpenses = transactions
        .filter(tx => {
          const txDate = typeof tx.date === 'string' ? parseISO(tx.date) : tx.date;
          return isSameDay(txDate, day) && (tx.type === 'expense' || tx.amount < 0);
        })
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      cumulativeSpent += dayExpenses;
      
      // Calculate ideal pace (linear)
      const idealPace = (budget.amount / days.length) * (index + 1);
      
      // Only show actual data up to today
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload;
    if (!data) return null;
    
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        {data.spent !== null && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Spent:</span>
            <span className="font-medium text-destructive">
              {formatCurrency(data.spent, budget.currency)}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Target:</span>
          <span className="font-medium text-primary">
            {formatCurrency(data.ideal, budget.currency)}
          </span>
        </div>
        {data.dayExpense !== null && data.dayExpense > 0 && (
          <div className="flex justify-between gap-4 mt-1 pt-1 border-t">
            <span className="text-muted-foreground">Day:</span>
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
          
          {/* Budget limit line */}
          <Line
            type="monotone"
            dataKey="budget"
            stroke="hsl(var(--destructive))"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name="Budget limit"
          />
          
          {/* Ideal spending pace */}
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Target pace"
          />
          
          {/* Actual spending */}
          <Line
            type="monotone"
            dataKey="spent"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={false}
            name="Actual spending"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SpendingTrendChart;
