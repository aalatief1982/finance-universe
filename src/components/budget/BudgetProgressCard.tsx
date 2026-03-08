import React from 'react';
import { Budget, BudgetScope } from '@/models/budget';
import { BudgetProgress } from '@/models/budget-period';
import { formatCurrency } from '@/utils/format-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Wallet, 
  Tag, 
  Tags, 
  ChevronRight,
  AlertTriangle,
  PiggyBank,
} from 'lucide-react';
import { getPeriodLabel } from '@/utils/budget-period-utils';

interface BudgetProgressCardProps {
  budget: Budget;
  progress: BudgetProgress;
  targetName: string;
  onClick?: () => void;
  showPeriod?: boolean;
  showScope?: boolean;
  compact?: boolean;
  showSourceBadge?: boolean;
}

const scopeIcons: Record<BudgetScope, React.ElementType> = {
  overall: PiggyBank,
  account: Wallet,
  category: Tag,
  subcategory: Tags,
};

const scopeLabels: Record<BudgetScope, string> = {
  overall: 'Overall',
  account: 'Account',
  category: 'Category',
  subcategory: 'Subcategory',
};

export function BudgetProgressCard({
  budget,
  progress,
  targetName,
  onClick,
  showPeriod = true,  // Default to true - always show period
  showScope = true,   // Default to true - always show scope
  compact = false,
  showSourceBadge = false, // Show Set/Calculated badge
}: BudgetProgressCardProps) {
  const Icon = scopeIcons[budget.scope];
  const { spent, budgeted, percentUsed, remaining, isOverBudget, daysRemaining, dailyBudgetRemaining } = progress;
  
  // Build dimension label (e.g., "Category • Monthly" or "Subcategory • Q1 2024")
  const dimensionLabel = React.useMemo(() => {
    const parts: string[] = [];
    if (showScope && budget.scope !== 'overall') {
      parts.push(scopeLabels[budget.scope]);
    }
    if (showPeriod) {
      parts.push(getPeriodLabel(budget.period));
    }
    return parts.join(' • ');
  }, [budget.scope, budget.period, showScope, showPeriod]);

  // Determine progress bar color
  const getProgressColor = () => {
    if (percentUsed >= 100) return 'bg-destructive';
    if (percentUsed >= 80) return 'bg-amber-500';
    if (percentUsed >= 50) return 'bg-accent';
    return 'bg-primary';
  };

  // Clamp visual progress to 100%
  const visualProgress = Math.min(percentUsed, 100);
  
  // Source badge component
  const SourceBadge = showSourceBadge && (
    <Badge 
      variant={budget.isOverride ? "secondary" : "outline"} 
      className={cn(
        "text-[10px] px-1.5 py-0",
        !budget.isOverride && "border-dashed"
      )}
    >
      {budget.isOverride ? "Set" : "Calc"}
    </Badge>
  );

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-card border transition-colors",
          onClick && "cursor-pointer hover:bg-accent/5"
        )}
        onClick={onClick}
        onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className={cn(
          "p-2 rounded-full",
          isOverBudget ? "bg-destructive/10" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isOverBudget ? "text-destructive" : "text-primary"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm truncate">{targetName}</span>
              {SourceBadge}
            </div>
            <span className={cn(
              "text-sm font-medium",
              isOverBudget && "text-destructive"
            )}>
              {Math.round(percentUsed)}%
            </span>
          </div>
          {dimensionLabel && (
            <span className="text-xs text-muted-foreground">{dimensionLabel}</span>
          )}
          
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all", getProgressColor())}
              style={{ width: `${visualProgress}%` }}
            />
          </div>
        </div>
        
        {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "p-3 rounded-lg bg-card border transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/20"
      )}
      onClick={onClick}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-full",
            isOverBudget ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              isOverBudget ? "text-destructive" : "text-primary"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-foreground">{targetName}</h3>
              {SourceBadge}
              {isOverBudget && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
            {dimensionLabel && (
              <span className="text-[11px] text-muted-foreground">
                {dimensionLabel}
              </span>
            )}
          </div>
        </div>
        
        {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-300", getProgressColor())}
            style={{ width: `${visualProgress}%` }}
          />
        </div>
      </div>

      {/* Stats — single row */}
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", isOverBudget && "text-destructive")}>
          {formatCurrency(spent, budget.currency)} / {formatCurrency(budgeted, budget.currency)}
        </span>
        <span className={cn(
          "font-medium",
          isOverBudget ? "text-destructive" : "text-primary"
        )}>
          {isOverBudget 
            ? `${formatCurrency(Math.abs(remaining), budget.currency)} over`
            : `${formatCurrency(remaining, budget.currency)} left`
          }
        </span>
      </div>
    </div>
  );
}

export default BudgetProgressCard;
