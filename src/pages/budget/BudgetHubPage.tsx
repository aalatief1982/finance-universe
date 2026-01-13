import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, BarChart3, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBudgetsWithProgress, useBudgetAlerts, useOverallBudgetProgress } from '@/hooks/useBudgets';
import { BudgetPeriod } from '@/models/budget';
import { OverallBudgetRing } from '@/components/budget/OverallBudgetRing';
import { BudgetProgressCard } from '@/components/budget/BudgetProgressCard';
import { BudgetAlertBanner } from '@/components/budget/BudgetAlertBanner';
import { formatCurrency } from '@/utils/format-utils';
import { transactionService } from '@/services/TransactionService';
import { accountService } from '@/services/AccountService';
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
  
  // Get target names for display
  const targetNames = useMemo(() => {
    const names: Record<string, string> = {};
    const categories = transactionService.getCategories();
    const accounts = accountService.getAccounts();
    
    categories.forEach(c => {
      names[c.id] = c.name;
    });
    accounts.forEach(a => {
      names[a.id] = a.name;
    });
    
    return names;
  }, []);

  const getTargetName = (budget: typeof budgetsWithProgress[0]): string => {
    return targetNames[budget.targetId] || budget.targetId;
  };

  // Get yearly budgets (replaces overall)
  const yearlyBudgets = budgetsWithProgress.filter(b => b.period === 'yearly');
  const otherBudgets = budgetsWithProgress.filter(b => b.period !== 'yearly');

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
            {/* Yearly Budget Ring */}
            {(yearlyBudgets.length > 0 || overallProgress) && (
              <div className="bg-card rounded-xl p-6 border">
                <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Yearly Spending
                </h2>
                <OverallBudgetRing
                  progress={yearlyBudgets[0]?.progress || overallProgress}
                  currency={yearlyBudgets[0]?.currency || 'USD'}
                  size="lg"
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
                      showPeriod={periodFilter === 'all'}
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
                      showPeriod={periodFilter === 'all'}
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
                      showPeriod={periodFilter === 'all'}
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
