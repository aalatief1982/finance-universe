import React from 'react';
import { Budget } from '@/models/budget';
import { BudgetProgress } from '@/models/budget-period';
import { formatCurrency } from '@/utils/format-utils';
import { formatPeriodLabel } from '@/utils/budget-period-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface BudgetHierarchyViewProps {
  currentBudget: Budget;
  parentBudget: Budget | null;
  siblingBudgets: Budget[];
  childBudgets: Budget[];
  getBudgetProgress: (budget: Budget) => BudgetProgress;
}

export function BudgetHierarchyView({
  currentBudget,
  parentBudget,
  siblingBudgets,
  childBudgets,
  getBudgetProgress,
}: BudgetHierarchyViewProps) {
  const navigate = useNavigate();
  
  const hasHierarchy = parentBudget || siblingBudgets.length > 0 || childBudgets.length > 0;
  
  if (!hasHierarchy) return null;
  
  const renderBudgetRow = (budget: Budget, isCurrent: boolean = false) => {
    const progress = getBudgetProgress(budget);
    const label = formatPeriodLabel(budget.period, budget.year, budget.periodIndex);
    
    return (
      <div 
        key={budget.id}
        className={cn(
          "flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors",
          isCurrent 
            ? "bg-primary/10 border border-primary/30" 
            : "hover:bg-muted/50"
        )}
        onClick={() => !isCurrent && navigate(`/budget/${budget.id}`)}
      >
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm",
            isCurrent ? "font-semibold text-primary" : "text-foreground"
          )}>
            {label}
          </span>
          {isCurrent && (
            <Badge variant="secondary" className="text-xs">Current</Badge>
          )}
          {!budget.isOverride && (
            <Badge variant="outline" className="text-xs border-dashed">Calculated</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={cn(
              "text-sm font-medium",
              progress.isOverBudget && "text-destructive"
            )}>
              {formatCurrency(progress.spent, budget.currency)}
            </span>
            <span className="text-muted-foreground text-sm"> / </span>
            <span className="text-sm">{formatCurrency(budget.amount, budget.currency)}</span>
          </div>
          
          {!isCurrent && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Period Hierarchy</CardTitle>
        <CardDescription>
          View related time period budgets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parent Period */}
        {parentBudget && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3" />
              <span>Parent Period</span>
            </div>
            {renderBudgetRow(parentBudget)}
          </div>
        )}
        
        {/* Siblings (including current) */}
        {siblingBudgets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Minus className="h-3 w-3" />
              <span>Same Period Type</span>
            </div>
            <div className="space-y-1">
              {[...siblingBudgets, currentBudget]
                .sort((a, b) => (a.periodIndex || 0) - (b.periodIndex || 0))
                .map(b => renderBudgetRow(b, b.id === currentBudget.id))}
            </div>
          </div>
        )}
        
        {/* No siblings - just show current */}
        {siblingBudgets.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Minus className="h-3 w-3" />
              <span>Current Period</span>
            </div>
            {renderBudgetRow(currentBudget, true)}
          </div>
        )}
        
        {/* Child Periods */}
        {childBudgets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowDown className="h-3 w-3" />
              <span>Child Periods</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {childBudgets
                .sort((a, b) => (a.periodIndex || 0) - (b.periodIndex || 0))
                .slice(0, 6) // Limit to 6 children to avoid too long list
                .map(b => renderBudgetRow(b))}
              {childBudgets.length > 6 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  +{childBudgets.length - 6} more
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BudgetHierarchyView;
