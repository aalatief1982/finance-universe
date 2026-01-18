import React from 'react';
import { Budget } from '@/models/budget';
import { PropagationResult } from '@/services/BudgetHierarchyService';
import { formatCurrency } from '@/utils/format-utils';
import { formatPeriodLabel } from '@/utils/budget-period-utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParentImpactPreviewProps {
  propagationResult: PropagationResult;
  currency: string;
  year: number;
}

export function ParentImpactPreview({ 
  propagationResult, 
  currency,
  year 
}: ParentImpactPreviewProps) {
  const { quarterUpdate, yearlyUpdate } = propagationResult;
  
  if (!quarterUpdate && !yearlyUpdate) return null;
  
  const updates = [quarterUpdate, yearlyUpdate].filter(Boolean);
  
  return (
    <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <ArrowUp className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Impact on Parent Periods</span>
      </div>
      
      <div className="space-y-2">
        {updates.map((update, idx) => {
          if (!update) return null;
          const isPositive = update.delta > 0;
          const periodLabel = formatPeriodLabel(update.period, year, update.periodIndex);
          
          return (
            <div 
              key={idx}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{periodLabel}:</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {formatCurrency(update.currentAmount, currency)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">
                  {formatCurrency(update.newAmount, currency)}
                </span>
                <span className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-amber-600" : "text-emerald-600"
                )}>
                  {isPositive ? (
                    <span className="flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +{formatCurrency(update.delta, currency)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" />
                      {formatCurrency(update.delta, currency)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ParentImpactPreview;
