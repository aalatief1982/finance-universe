import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BudgetProgress } from '@/models/budget-period';
import { formatCurrency } from '@/utils/format-utils';
import { cn } from '@/lib/utils';

interface OverallBudgetRingProps {
  progress: BudgetProgress | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  /** Display label for the budget dimension, e.g., "Overall • Monthly" */
  dimensionLabel?: string;
}

const sizeConfig = {
  sm: { outer: 60, inner: 45, fontSize: 'text-xs' },
  md: { outer: 90, inner: 70, fontSize: 'text-sm' },
  lg: { outer: 120, inner: 95, fontSize: 'text-base' },
};

export function OverallBudgetRing({
  progress,
  currency = 'USD',
  size = 'md',
  showLabels = true,
  className,
  dimensionLabel,
}: OverallBudgetRingProps) {
  const config = sizeConfig[size];
  
  if (!progress) {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div 
          className="rounded-full bg-muted flex items-center justify-center"
          style={{ width: config.outer * 2, height: config.outer * 2 }}
        >
          <span className="text-muted-foreground text-sm">No budget set</span>
        </div>
      </div>
    );
  }

  const { spent, budgeted, percentUsed, remaining, isOverBudget } = progress;
  
  // Clamp percent for visual display (max 100% for the ring)
  const displayPercent = Math.min(percentUsed, 100);
  const remainingPercent = 100 - displayPercent;

  // Determine color based on usage
  const getColor = () => {
    if (percentUsed >= 100) return 'hsl(var(--destructive))';
    if (percentUsed >= 80) return 'hsl(var(--warning, 38 92% 50%))';
    if (percentUsed >= 50) return 'hsl(var(--accent))';
    return 'hsl(var(--primary))';
  };

  const data = [
    { name: 'spent', value: displayPercent },
    { name: 'remaining', value: remainingPercent },
  ];

  const COLORS = [getColor(), 'hsl(var(--muted))'];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.outer * 2, height: config.outer * 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={config.inner}
              outerRadius={config.outer}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", config.fontSize, isOverBudget && "text-destructive")}>
            {Math.round(percentUsed)}%
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground">used</span>
          )}
        </div>
      </div>
      
      {showLabels && (
        <div className="mt-3 text-center space-y-1">
          {/* Dimension label - shows what this budget represents */}
          {dimensionLabel && (
            <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full inline-block mb-2">
              {dimensionLabel}
            </div>
          )}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Spent: </span>
              <span className={cn("font-medium", isOverBudget && "text-destructive")}>
                {formatCurrency(spent, currency)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Budget: </span>
              <span className="font-medium">
                {formatCurrency(budgeted, currency)}
              </span>
            </div>
          </div>
          <div className={cn(
            "text-sm font-medium",
            isOverBudget ? "text-destructive" : "text-primary"
          )}>
            {isOverBudget 
              ? `Over by ${formatCurrency(Math.abs(remaining), currency)}`
              : `${formatCurrency(remaining, currency)} remaining`
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default OverallBudgetRing;
