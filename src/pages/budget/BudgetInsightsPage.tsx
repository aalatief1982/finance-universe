import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetLayout } from '@/components/budget/BudgetLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { Budget } from '@/models/budget';
import { formatCurrency } from '@/utils/format-utils';
import { getCurrentPeriodDates, getTotalDaysInPeriod, formatPeriodLabel } from '@/utils/budget-period-utils';
import { 
  AlertTriangle, 
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  title: string;
  description: string;
  action?: { label: string; path: string };
  budgetId?: string;
}

const BudgetInsightsPage = () => {
  const navigate = useNavigate();
  const budgets = React.useMemo(() => budgetService.getBudgets(), []);
  const accounts = React.useMemo(() => accountService.getAccounts(), []);
  const categories = React.useMemo(() => transactionService.getCategories(), []);

  // Get display name with period
  const getBudgetDisplayName = (b: Budget) => {
    const periodName = formatPeriodLabel(b.period, b.year, b.periodIndex);
    
    if (b.scope === 'overall') {
      return periodName;
    }
    
    const all = [...accounts, ...categories];
    const t = all.find((a: any) => a.id === b.targetId);
    const scopeName = t ? (t as any).name : b.targetId;
    return `${scopeName} • ${periodName}`;
  };

  // Generate insights
  const insights = React.useMemo(() => {
    const result: Insight[] = [];

    budgets.forEach(budget => {
      const progress = budgetService.getBudgetProgress(budget);
      const targetName = getBudgetDisplayName(budget);
      const periodDates = getCurrentPeriodDates(budget.period);
      const totalDays = getTotalDaysInPeriod(periodDates.start, periodDates.end);
      const daysPassed = totalDays - progress.daysRemaining;
      const expectedPercent = (daysPassed / totalDays) * 100;

      // Over budget alert
      if (progress.isOverBudget) {
        result.push({
          id: `${budget.id}_over`,
          type: 'danger',
          title: `${targetName} Over Budget`,
          description: `You've exceeded your budget by ${formatCurrency(Math.abs(progress.remaining), budget.currency)}. Consider reviewing your spending or adjusting the budget.`,
          action: { label: 'View Details', path: `/budget/${budget.id}` },
          budgetId: budget.id,
        });
      }
      // Approaching limit (80%+)
      else if (progress.percentUsed >= 80) {
        result.push({
          id: `${budget.id}_warning`,
          type: 'warning',
          title: `${targetName} Approaching Limit`,
          description: `You've used ${Math.round(progress.percentUsed)}% of your budget with ${progress.daysRemaining} days remaining. You have ${formatCurrency(progress.remaining, budget.currency)} left.`,
          action: { label: 'View Details', path: `/budget/${budget.id}` },
          budgetId: budget.id,
        });
      }
      // Spending ahead of pace
      else if (progress.percentUsed > expectedPercent + 15) {
        result.push({
          id: `${budget.id}_ahead`,
          type: 'warning',
          title: `${targetName} Spending Ahead`,
          description: `Your spending is ${Math.round(progress.percentUsed - expectedPercent)}% ahead of target pace. At this rate, you may exceed your budget.`,
          action: { label: 'View Trend', path: `/budget/${budget.id}` },
          budgetId: budget.id,
        });
      }
      // Good spending pace
      else if (progress.percentUsed < expectedPercent - 10 && daysPassed > 7) {
        result.push({
          id: `${budget.id}_good`,
          type: 'success',
          title: `${targetName} On Track`,
          description: `Great job! Your spending is ${Math.round(expectedPercent - progress.percentUsed)}% below target pace. Keep it up!`,
          budgetId: budget.id,
        });
      }
      // Very low spending (under 10% past halfway)
      else if (progress.percentUsed < 10 && daysPassed > totalDays / 2) {
        result.push({
          id: `${budget.id}_under`,
          type: 'info',
          title: `${targetName} Under-Utilized`,
          description: `You've only spent ${Math.round(progress.percentUsed)}% of your budget. Consider if this budget amount is realistic or if you're missing transactions.`,
          budgetId: budget.id,
        });
      }

      // Daily budget insights
      if (progress.daysRemaining > 0 && !progress.isOverBudget) {
        const avgDailySpend = progress.spent / Math.max(daysPassed, 1);
        const projectedTotal = avgDailySpend * totalDays;
        
        if (projectedTotal > budget.amount * 1.1) {
          const projectedOverage = projectedTotal - budget.amount;
          result.push({
            id: `${budget.id}_projection`,
            type: 'warning',
            title: `${targetName} Projection Warning`,
            description: `At your current pace (~${formatCurrency(avgDailySpend, budget.currency)}/day), you're projected to exceed your budget by ${formatCurrency(projectedOverage, budget.currency)}.`,
            action: { label: 'Adjust Budget', path: `/budget/set?edit=${budget.id}` },
            budgetId: budget.id,
          });
        }
      }
    });

    // No budgets insight
    if (budgets.length === 0) {
      result.push({
        id: 'no_budgets',
        type: 'info',
        title: 'No Budgets Set',
        description: 'Start tracking your spending by creating your first budget. Set limits for categories, accounts, or overall spending.',
        action: { label: 'Create Budget', path: '/budget/set' },
      });
    }

    // Yearly budget missing
    const hasYearly = budgets.some(b => b.period === 'yearly');
    if (budgets.length > 0 && !hasYearly) {
      result.push({
        id: 'no_yearly',
        type: 'info',
        title: 'Consider a Yearly Budget',
        description: 'You have period budgets but no yearly spending limit. A yearly budget helps track total spending across the year.',
        action: { label: 'Add Yearly Budget', path: '/budget/set?period=yearly' },
      });
    }

    // Sort: dangers first, then warnings, then others
    const order = { danger: 0, warning: 1, info: 2, success: 3 };
    result.sort((a, b) => order[a.type] - order[b.type]);

    return result;
  }, [budgets, accounts, categories]);

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'danger':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCardStyle = (type: Insight['type']) => {
    switch (type) {
      case 'danger':
        return 'border-destructive/50 bg-destructive/5';
      case 'warning':
        return 'border-amber-500/50 bg-amber-500/5';
      case 'success':
        return 'border-green-500/50 bg-green-500/5';
      case 'info':
      default:
        return 'border-blue-500/50 bg-blue-500/5';
    }
  };

  // Summary stats
  const summaryStats = React.useMemo(() => {
    const allProgress = budgets.map(b => budgetService.getBudgetProgress(b));
    const overBudget = allProgress.filter(p => p.isOverBudget).length;
    const onTrack = allProgress.filter(p => !p.isOverBudget && p.percentUsed <= 80).length;
    const atRisk = allProgress.filter(p => !p.isOverBudget && p.percentUsed > 80).length;
    
    return { overBudget, onTrack, atRisk, total: budgets.length };
  }, [budgets]);

  return (
    <BudgetLayout 
      title="Insights" 
      description="Smart analysis of your spending patterns"
      showPeriodFilter={false}
      showAddButton={false}
    >
      {/* Summary Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className={summaryStats.onTrack > 0 ? 'border-green-500/30' : ''}>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-green-500">{summaryStats.onTrack}</div>
              <div className="text-xs text-muted-foreground">On Track</div>
            </CardContent>
          </Card>
          <Card className={summaryStats.atRisk > 0 ? 'border-amber-500/30' : ''}>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-amber-500">{summaryStats.atRisk}</div>
              <div className="text-xs text-muted-foreground">At Risk</div>
            </CardContent>
          </Card>
          <Card className={summaryStats.overBudget > 0 ? 'border-destructive/30' : ''}>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-destructive">{summaryStats.overBudget}</div>
              <div className="text-xs text-muted-foreground">Over Budget</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights */}
      <div className="space-y-3">
        {insights.map(insight => (
          <Card key={insight.id} className={getCardStyle(insight.type)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(insight.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-medium">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate(insight.action!.path)}
                    >
                      {insight.action.label}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {insights.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-medium text-lg">All budgets look good!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                No issues or suggestions at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </BudgetLayout>
  );
};

export default BudgetInsightsPage;
