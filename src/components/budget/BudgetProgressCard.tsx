import React from 'react';
import { Budget, BudgetScope } from '@/models/budget';
import { BudgetProgress } from '@/models/budget-period';
import { formatCurrency } from '@/utils/format-utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Wallet, 
  Tag, 
  Tags, 
  ChevronRight,
  AlertTriangle,
  PiggyBank,
  Edit2
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
        "p-4 rounded-xl bg-card border transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/20"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-full",
            isOverBudget ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              isOverBudget ? "text-destructive" : "text-primary"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{targetName}</h3>
              {SourceBadge}
            </div>
            {dimensionLabel && (
              <span className="text-xs text-muted-foreground">
                {dimensionLabel}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isOverBudget && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Over budget</span>
            </div>
          )}
          
          {onClick && (
            <div className="flex items-center gap-1 p-1.5 rounded-md hover:bg-accent/10 transition-colors">
              <Edit2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Edit</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-300", getProgressColor())}
            style={{ width: `${visualProgress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Spent: </span>
          <span className={cn("font-medium", isOverBudget && "text-destructive")}>
            {formatCurrency(spent, budget.currency)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">of </span>
          <span className="font-medium">
            {formatCurrency(budgeted, budget.currency)}
          </span>
        </div>
      </div>

      {/* Additional info */}
      <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isOverBudget 
            ? `${formatCurrency(Math.abs(remaining), budget.currency)} over`
            : `${formatCurrency(remaining, budget.currency)} left`
          }
        </span>
        {daysRemaining > 0 && !isOverBudget && (
          <span>
            ~{formatCurrency(dailyBudgetRemaining, budget.currency)}/day
          </span>
        )}
        {daysRemaining > 0 && (
          <span>{daysRemaining} days left</span>
        )}
      </div>
    </div>
  );
}

export default BudgetProgressCard;
