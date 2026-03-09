/**
 * @file BudgetHubPage.tsx
 * @description Page component for BudgetHubPage.
 *
 * @module pages/budget/BudgetHubPage
 *
 * @responsibilities
 * 1. Compose layout and section components
 * 2. Load data or invoke services for the page
 * 3. Handle navigation and page-level actions
 *
 * @review-tags
 * - @ui: page composition
 *
 * @review-checklist
 * - [ ] Data loading handles empty states
 * - [ ] Navigation hooks are wired correctly
 */
import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetLayout } from '@/components/budget/BudgetLayout';
import { Settings, ChevronRight } from 'lucide-react';
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
import { logFirebaseOnlyEvent } from '@/utils/firebase-analytics';
import { useLanguage } from '@/i18n/LanguageContext';

const BudgetHubPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { period, year, periodIndex } = useBudgetPeriodParams();
  
  // Track screen view
  useEffect(() => {
    logFirebaseOnlyEvent('view_budget', { timestamp: Date.now() });
  }, []);
  
  // Build filter based on URL params
  const budgetFilter = useMemo(() => ({ period, year, periodIndex }), [period, year, periodIndex]);
  
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
    if (budget.scope === 'overall') return t('budget.overallBudget');
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
      title={t('budget.budgets')} 
      description={t('budget.trackSpendingLimits')}
      showAddButton={!loading}
    >
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
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
          <h2 className="text-lg font-semibold mb-2">{t('budget.noBudgetsYet')}</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            {t('budget.createBudgetsDesc')}
          </p>
          <Button onClick={() => navigate('/budget/set')}>
            {t('budget.createFirstBudget')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Overall Budget Summary — compact */}
          {overallBudget && (
            <div 
              className="bg-card rounded-xl p-4 border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/budget/set?edit=${overallBudget.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/budget/set?edit=${overallBudget.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-4">
                <OverallBudgetRing
                  progress={overallBudget.progress}
                  currency={overallBudget.currency}
                  size="sm"
                  showLabels={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold">{t('budget.overallBudget')}</h2>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-lg font-bold", overallBudget.progress.isOverBudget && "text-destructive")}>
                      {formatCurrency(overallBudget.progress.spent, overallBudget.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {formatCurrency(overallBudget.progress.budgeted, overallBudget.currency)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs font-medium mt-0.5",
                    overallBudget.progress.isOverBudget ? "text-destructive" : "text-primary"
                  )}>
                    {overallBudget.progress.isOverBudget 
                      ? `${t('budget.overBy')} ${formatCurrency(Math.abs(overallBudget.progress.remaining), overallBudget.currency)}`
                      : `${formatCurrency(overallBudget.progress.remaining, overallBudget.currency)} ${t('budget.remaining')}`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Yearly Budget (non-overall) — compact */}
          {(yearlyBudgets.length > 0 || (overallProgress && !overallBudget)) && (
            <div className="bg-card rounded-xl p-4 border">
              <OverallBudgetRing
                progress={yearlyBudgets[0]?.progress || overallProgress}
                currency={yearlyBudgets[0]?.currency || getUserSettings().currency || 'USD'}
                size="sm"
                dimensionLabel={yearlyBudgets[0] 
                  ? `${getTargetName(yearlyBudgets[0])} • ${formatPeriodLabel(yearlyBudgets[0].period, yearlyBudgets[0].year, yearlyBudgets[0].periodIndex)}` 
                  : `${new Date().getFullYear()}`}
              />
            </div>
          )}

          {/* Account Budgets */}
          {groupedBudgets.account.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('budget.byAccount')}
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
                {t('budget.byCategory')}
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
                {t('budget.bySubcategory')}
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
