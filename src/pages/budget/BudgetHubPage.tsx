import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetLayout } from '@/components/budget/BudgetLayout';
import { Settings, ChevronRight, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBudgetsWithProgress, useBudgetAlerts, useOverallBudgetProgress } from '@/hooks/useBudgets';
import { useBudgetPeriodParams } from '@/hooks/useBudgetPeriodParams';
import { OverallBudgetRing } from '@/components/budget/OverallBudgetRing';
import { BudgetProgressCard } from '@/components/budget/BudgetProgressCard';
import { BudgetAlertBanner } from '@/components/budget/BudgetAlertBanner';
import { formatCurrency } from '@/utils/format-utils';
import { getUserSettings } from '@/utils/storage-utils';
import { formatPeriodLabel } from '@/utils/budget-period-utils';
import { accountService } from '@/services/AccountService';
import { getCategoryHierarchy } from '@/lib/categories-data';
import { cn } from '@/lib/utils';

const BudgetHubPage = () => {
  const navigate = useNavigate();
  const { period, year, periodIndex } = useBudgetPeriodParams();
  
  // Build filter based on URL params
  const budgetFilter = useMemo(() => {
    if (period === 'all') return undefined;
    return { period, year, periodIndex };
  }, [period, year, periodIndex]);
  
  const { data: budgetsWithProgress, loading, summary } = useBudgetsWithProgress(budgetFilter);
  const { alerts, dismissAlert } = useBudgetAlerts();
  const { progress: overallProgress } = useOverallBudgetProgress();
  
  // Get target names for display from category hierarchy and accounts
  const targetNames = useMemo(() => {
    const names: Record<string, string> = {};
    const hierarchy = getCategoryHierarchy();
    const accounts = accountService.getAccounts();
    
    // Add parent categories and subcategories
    hierarchy.forEach(parent => {
      names[parent.id] = parent.name;
      parent.subcategories.forEach(sub => {
        names[sub.id] = sub.name;
      });
    });
    
    // Add accounts
    accounts.forEach(a => {
      names[a.id] = a.name;
    });
    
    return names;
  }, []);

  const getTargetName = (budget: typeof budgetsWithProgress[0]): string => {
    if (budget.scope === 'overall') return 'Overall Budget';
    return targetNames[budget.targetId] || budget.targetId;
  };

  // Get overall budget for the current period
  const overallBudget = useMemo(() => {
    return budgetsWithProgress.find(b => b.scope === 'overall');
  }, [budgetsWithProgress]);

  // Get yearly budgets (excluding overall)
  const yearlyBudgets = budgetsWithProgress.filter(b => b.period === 'yearly' && b.scope !== 'overall');
  const otherBudgets = budgetsWithProgress.filter(b => b.period !== 'yearly' && b.scope !== 'overall');

  // Group by scope for better organization
  const groupedBudgets = useMemo(() => {
    const groups: Record<string, typeof otherBudgets> = {
      account: [],
      category: [],
      subcategory: [],
    };
    
    otherBudgets.forEach(budget => {
      if (groups[budget.scope]) {
        groups[budget.scope].push(budget);
      }
    });
    
    return groups;
  }, [otherBudgets]);

  const hasAnyBudgets = budgetsWithProgress.length > 0;

  return (
    <BudgetLayout 
      title="Budgets" 
      description="Track your spending limits"
      showAddButton={!loading}
    >
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.slice(0, 3).map(alert => (
            <BudgetAlertBanner
              key={`${alert.budgetId}-${alert.threshold}`}
              alert={alert}
              onDismiss={dismissAlert}
            />
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !hasAnyBudgets ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No budgets yet</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Create budgets to track your spending and stay on top of your finances.
          </p>
          <Button onClick={() => navigate('/budget/set')}>
            Create Your First Budget
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Budget Card - Top Level */}
          {overallBudget && (
            <div 
              className="bg-card rounded-xl p-6 border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/budget/set?edit=${overallBudget.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <PiggyBank className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Overall Budget</h2>
                    <p className="text-sm text-muted-foreground">
                      {overallBudget.period.charAt(0).toUpperCase() + overallBudget.period.slice(1)} spending limit
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <OverallBudgetRing
                progress={overallBudget.progress}
                currency={overallBudget.currency}
                size="lg"
                dimensionLabel={formatPeriodLabel(overallBudget.period, overallBudget.year, overallBudget.periodIndex)}
              />
            </div>
          )}

          {/* Yearly Budget Ring (for non-overall yearly budgets) */}
          {(yearlyBudgets.length > 0 || (overallProgress && !overallBudget)) && (
            <div className="bg-card rounded-xl p-6 border">
              <OverallBudgetRing
                progress={yearlyBudgets[0]?.progress || overallProgress}
                currency={yearlyBudgets[0]?.currency || getUserSettings().currency || 'USD'}
                size="lg"
                dimensionLabel={yearlyBudgets[0] 
                  ? `${getTargetName(yearlyBudgets[0])} • ${formatPeriodLabel(yearlyBudgets[0].period, yearlyBudgets[0].year, yearlyBudgets[0].periodIndex)}` 
                  : `${new Date().getFullYear()}`}
              />
            </div>
          )}

          {/* Summary Stats */}
          {hasAnyBudgets && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-lg p-3 border text-center">
                <p className="text-xs text-muted-foreground">Total Budget</p>
                <p className="text-lg font-bold">
                  {formatCurrency(summary.totalBudgeted, getUserSettings().currency || 'USD')}
                </p>
              </div>
              <div className="bg-card rounded-lg p-3 border text-center">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className={cn(
                  "text-lg font-bold",
                  summary.totalSpent > summary.totalBudgeted && "text-destructive"
                )}>
                  {formatCurrency(summary.totalSpent, getUserSettings().currency || 'USD')}
                </p>
              </div>
              <div className="bg-card rounded-lg p-3 border text-center">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className={cn(
                  "text-lg font-bold",
                  summary.totalRemaining < 0 ? "text-destructive" : "text-primary"
                )}>
                  {formatCurrency(summary.totalRemaining, getUserSettings().currency || 'USD')}
                </p>
              </div>
            </div>
          )}

          {/* Account Budgets */}
          {groupedBudgets.account.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                By Account
              </h3>
              <div className="space-y-3">
                {groupedBudgets.account.map(budget => (
                  <BudgetProgressCard
                    key={budget.id}
                    budget={budget}
                    progress={budget.progress}
                    targetName={getTargetName(budget)}
                    onClick={() => navigate(`/budget/set?edit=${budget.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category Budgets */}
          {groupedBudgets.category.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                By Category
              </h3>
              <div className="space-y-3">
                {groupedBudgets.category.map(budget => (
                  <BudgetProgressCard
                    key={budget.id}
                    budget={budget}
                    progress={budget.progress}
                    targetName={getTargetName(budget)}
                    onClick={() => navigate(`/budget/set?edit=${budget.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Subcategory Budgets */}
          {groupedBudgets.subcategory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                By Subcategory
              </h3>
              <div className="space-y-3">
                {groupedBudgets.subcategory.map(budget => (
                  <BudgetProgressCard
                    key={budget.id}
                    budget={budget}
                    progress={budget.progress}
                    targetName={getTargetName(budget)}
                    compact
                    onClick={() => navigate(`/budget/set?edit=${budget.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </BudgetLayout>
  );
};

export default BudgetHubPage;
