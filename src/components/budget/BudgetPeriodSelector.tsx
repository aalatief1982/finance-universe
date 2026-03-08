import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PeriodFilter } from '@/hooks/useBudgetPeriodParams';

const PERIOD_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
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
    <div className={cn("space-y-1.5", className)}>
      {/* Period Type Tabs */}
      <Tabs 
        value={period} 
        onValueChange={(v) => onPeriodChange(v as PeriodFilter)}
      >
        <TabsList className="grid w-full grid-cols-3 h-8">
          {PERIOD_OPTIONS.map(option => (
            <TabsTrigger key={option.value} value={option.value} className="text-xs py-1">
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium min-w-[100px] text-center">
            {periodLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
      </div>
    </div>
  );
}

export default BudgetPeriodSelector;
