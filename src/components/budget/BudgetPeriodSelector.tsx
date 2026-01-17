import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PeriodFilter } from '@/hooks/useBudgetPeriodParams';

const PERIOD_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
  { value: 'quarterly', label: 'Quarter' },
  { value: 'yearly', label: 'Year' },
];

interface BudgetPeriodSelectorProps {
  period: PeriodFilter;
  year: number;
  periodIndex: number;
  periodLabel: string;
  onPeriodChange: (period: PeriodFilter) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  className?: string;
}

export function BudgetPeriodSelector({
  period,
  periodLabel,
  onPeriodChange,
  onNavigate,
  className,
}: BudgetPeriodSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Period Type Tabs */}
      <Tabs 
        value={period} 
        onValueChange={(v) => onPeriodChange(v as PeriodFilter)}
      >
        <TabsList className="grid w-full grid-cols-5">
          {PERIOD_OPTIONS.map(option => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Period Navigation (hidden for 'all') */}
      {period !== 'all' && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {periodLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default BudgetPeriodSelector;
