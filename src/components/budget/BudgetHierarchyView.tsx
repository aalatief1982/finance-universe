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
import { useLanguage } from '@/i18n/LanguageContext';

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
  const { t, isRtl } = useLanguage();
  
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
        onKeyDown={(e) => !isCurrent && e.key === 'Enter' && navigate(`/budget/${budget.id}`)}
        role={isCurrent ? undefined : "button"}
        tabIndex={isCurrent ? undefined : 0}
      >
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm",
            isCurrent ? "font-semibold text-primary" : "text-foreground"
          )}>
            {label}
          </span>
          {isCurrent && (
            <Badge variant="secondary" className="text-xs">{t('hierarchy.current')}</Badge>
          )}
          {!budget.isOverride && (
            <Badge variant="outline" className="text-xs border-dashed">{t('hierarchy.calculated')}</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn("text-sm", isRtl ? "text-left" : "text-right")}>
            <span className={cn(
              "font-medium",
              progress.isOverBudget && "text-destructive"
            )}>
              {formatCurrency(progress.spent, budget.currency)}
            </span>
            <span className="text-muted-foreground"> / </span>
            <span>{formatCurrency(budget.amount, budget.currency)}</span>
          </div>
          
          {!isCurrent && <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isRtl && "rotate-180")} />}
        </div>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('hierarchy.title')}</CardTitle>
        <CardDescription>{t('hierarchy.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {parentBudget && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3" />
              <span>{t('hierarchy.parent')}</span>
            </div>
            {renderBudgetRow(parentBudget)}
          </div>
        )}
        
        {siblingBudgets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Minus className="h-3 w-3" />
              <span>{t('hierarchy.samePeriod')}</span>
            </div>
            <div className="space-y-1">
              {[...siblingBudgets, currentBudget]
                .sort((a, b) => (a.periodIndex || 0) - (b.periodIndex || 0))
                .map(b => renderBudgetRow(b, b.id === currentBudget.id))}
            </div>
          </div>
        )}
        
        {siblingBudgets.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Minus className="h-3 w-3" />
              <span>{t('hierarchy.currentPeriod')}</span>
            </div>
            {renderBudgetRow(currentBudget, true)}
          </div>
        )}
        
        {childBudgets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowDown className="h-3 w-3" />
              <span>{t('hierarchy.childPeriods')}</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {childBudgets
                .sort((a, b) => (a.periodIndex || 0) - (b.periodIndex || 0))
                .slice(0, 6)
                .map(b => renderBudgetRow(b))}
              {childBudgets.length > 6 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  {t('hierarchy.more').replace('{count}', String(childBudgets.length - 6))}
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
