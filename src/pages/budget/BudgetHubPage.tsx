import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, BarChart3, Lightbulb, ChevronRight, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBudgetsWithProgress, useBudgetAlerts, useOverallBudgetProgress } from '@/hooks/useBudgets';
import { BudgetPeriod } from '@/models/budget';
import { OverallBudgetRing } from '@/components/budget/OverallBudgetRing';
import { BudgetProgressCard } from '@/components/budget/BudgetProgressCard';
import { BudgetAlertBanner } from '@/components/budget/BudgetAlertBanner';
import { formatCurrency } from '@/utils/format-utils';
import { accountService } from '@/services/AccountService';
import { getCategoryHierarchy } from '@/lib/categories-data';
import { budgetService } from '@/services/BudgetService';
import { cn } from '@/lib/utils';

type PeriodFilter = 'all' | BudgetPeriod;

const PERIOD_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
  { value: 'quarterly', label: 'Quarter' },
  { value: 'yearly', label: 'Year' },
];

const BudgetHubPage = () => {
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');
  
  const { data: budgetsWithProgress, loading, summary, refresh } = useBudgetsWithProgress(
    periodFilter === 'all' ? undefined : periodFilter
  );
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

  // Note: Scope types (overall, category, subcategory, account) are independent
  // Distribution only happens across time periods (yearly → quarterly → monthly → weekly)

  const hasAnyBudgets = budgetsWithProgress.length > 0;

  return (
    <Layout showBack>
      <div className="container px-4 pb-24">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Budgets</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/budget/insights')}
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/budget/report')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate('/budget/set')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Period Filter */}
        <Tabs 
          value={periodFilter} 
          onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            {PERIOD_OPTIONS.map(option => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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
              <Plus className="h-4 w-4 mr-2" />
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
                  dimensionLabel={`Overall • ${overallBudget.period.charAt(0).toUpperCase() + overallBudget.period.slice(1)}`}
                />

              </div>
            )}

            {/* Yearly Budget Ring (for non-overall yearly budgets) */}
            {(yearlyBudgets.length > 0 || (overallProgress && !overallBudget)) && (
              <div className="bg-card rounded-xl p-6 border">
                <OverallBudgetRing
                  progress={yearlyBudgets[0]?.progress || overallProgress}
                  currency={yearlyBudgets[0]?.currency || 'USD'}
                  size="lg"
                  dimensionLabel={yearlyBudgets[0] 
                    ? `${getTargetName(yearlyBudgets[0])} • Yearly` 
                    : 'Overall • Yearly'}
                />
              </div>
            )}

            {/* Summary Stats */}
            {hasAnyBudgets && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card rounded-lg p-3 border text-center">
                  <p className="text-xs text-muted-foreground">Total Budget</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(summary.totalBudgeted, 'USD')}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-3 border text-center">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className={cn(
                    "text-lg font-bold",
                    summary.totalSpent > summary.totalBudgeted && "text-destructive"
                  )}>
                    {formatCurrency(summary.totalSpent, 'USD')}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-3 border text-center">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className={cn(
                    "text-lg font-bold",
                    summary.totalRemaining < 0 ? "text-destructive" : "text-primary"
                  )}>
                    {formatCurrency(summary.totalRemaining, 'USD')}
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
      </div>
    </Layout>
  );
};

export default BudgetHubPage;
