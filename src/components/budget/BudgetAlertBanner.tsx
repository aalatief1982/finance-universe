import React from 'react';
import { BudgetAlert } from '@/models/budget-period';
import { Budget } from '@/models/budget';
import { budgetService } from '@/services/BudgetService';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetAlertBannerProps {
  alert: BudgetAlert;
  onDismiss: (budgetId: string, threshold: number) => void;
  className?: string;
}

export function BudgetAlertBanner({ alert, onDismiss, className }: BudgetAlertBannerProps) {
  const budget = budgetService.getBudgetById(alert.budgetId);
  
  if (!budget) return null;

  const getTargetName = (budget: Budget): string => {
    // For all scopes, return the target ID (simplified)
    // In production, you'd look up the name from the appropriate service
    return budget.targetId || 'Budget';
  };

  const getMessage = () => {
    const targetName = getTargetName(budget);
    if (alert.threshold >= 100) {
      return `You've exceeded your ${targetName} budget!`;
    }
    return `You've used ${Math.round(alert.percentUsed)}% of your ${targetName} budget`;
  };

  const getVariant = () => {
    if (alert.threshold >= 100) return 'destructive';
    if (alert.threshold >= 80) return 'warning';
    return 'default';
  };

  const variant = getVariant();

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        variant === 'destructive' && "bg-destructive/10 border border-destructive/20",
        variant === 'warning' && "bg-amber-500/10 border border-amber-500/20",
        variant === 'default' && "bg-primary/10 border border-primary/20",
        className
      )}
    >
      <div className={cn(
        "p-2 rounded-full",
        variant === 'destructive' && "bg-destructive/20",
        variant === 'warning' && "bg-amber-500/20",
        variant === 'default' && "bg-primary/20"
      )}>
        {alert.threshold >= 100 ? (
          <AlertTriangle className={cn(
            "h-4 w-4",
            variant === 'destructive' && "text-destructive",
            variant === 'warning' && "text-amber-600",
            variant === 'default' && "text-primary"
          )} />
        ) : (
          <TrendingUp className={cn(
            "h-4 w-4",
            variant === 'destructive' && "text-destructive",
            variant === 'warning' && "text-amber-600",
            variant === 'default' && "text-primary"
          )} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          variant === 'destructive' && "text-destructive",
          variant === 'warning' && "text-amber-700 dark:text-amber-500",
          variant === 'default' && "text-primary"
        )}>
          {getMessage()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {alert.threshold}% threshold reached
        </p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(alert.budgetId, alert.threshold);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default BudgetAlertBanner;
