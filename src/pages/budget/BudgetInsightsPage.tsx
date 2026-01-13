import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTransactions } from '@/context/TransactionContext';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { Budget } from '@/models/budget';
import { formatCurrency } from '@/utils/format-utils';
import { getPeriodLabel, getCurrentPeriodDates, getTotalDaysInPeriod, getDaysRemainingInPeriod } from '@/utils/budget-period-utils';
import { differenceInDays, format, parseISO, subDays } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Calendar,
  ArrowRight,
  Clock,
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
  const { transactions } = useTransactions();
  const budgets = React.useMemo(() => budgetService.getBudgets(), []);
  const accounts = React.useMemo(() => accountService.getAccounts(), []);
  const categories = React.useMemo(() => transactionService.getCategories(), []);

  const getTargetName = (b: Budget) => {
    if (b.scope === 'overall') return 'Overall';
    const all = [...accounts, ...categories];
    const t = all.find((a: any) => a.id === b.targetId);
    return t ? (t as any).name : b.targetId;
  };

  // Generate insights
  const insights = React.useMemo(() => {
    const result: Insight[] = [];

    budgets.forEach(budget => {
      const progress = budgetService.getBudgetProgress(budget);
      const targetName = getTargetName(budget);
      const periodDates = getCurrentPeriodDates(budget.period, budget.startDate);
      const totalDays = getTotalDaysInPeriod(periodDates.start, periodDates.end);
      const daysPassed = totalDays - progress.daysRemaining;
      const expectedPercent = (daysPassed / totalDays) * 100;

      // Over budget alert
      if (progress.isOverBudget) {
        result.push({
          id: `${budget.id}_over`,
          type: 'danger',
          title: `${targetName} Over Budget`,
          description: `You've exceeded your ${targetName} budget by ${formatCurrency(Math.abs(progress.remaining), budget.currency)}. Consider reviewing your spending or adjusting the budget.`,
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
          description: `You've used ${Math.round(progress.percentUsed)}% of your ${targetName} budget with ${progress.daysRemaining} days remaining. You have ${formatCurrency(progress.remaining, budget.currency)} left.`,
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
          description: `Your ${targetName} spending is ${Math.round(progress.percentUsed - expectedPercent)}% ahead of target pace. At this rate, you may exceed your budget.`,
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
          description: `Great job! Your ${targetName} spending is ${Math.round(expectedPercent - progress.percentUsed)}% below target pace. Keep it up!`,
          budgetId: budget.id,
        });
      }
      // Very low spending (under 10% past halfway)
      else if (progress.percentUsed < 10 && daysPassed > totalDays / 2) {
        result.push({
          id: `${budget.id}_under`,
          type: 'info',
          title: `${targetName} Under-Utilized`,
          description: `You've only spent ${Math.round(progress.percentUsed)}% of your ${targetName} budget. Consider if this budget amount is realistic or if you're missing transactions.`,
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

    // Overall budget missing
    const hasOverall = budgets.some(b => b.scope === 'overall');
    if (budgets.length > 0 && !hasOverall) {
      result.push({
        id: 'no_overall',
        type: 'info',
        title: 'Consider an Overall Budget',
        description: 'You have category budgets but no overall spending limit. An overall budget helps track total spending across all categories.',
        action: { label: 'Add Overall Budget', path: '/budget/set?scope=overall' },
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
    <Layout showBack>
      <div className="container px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Budget Insights</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Smart analysis of your spending patterns
          </p>
        </div>

        {/* Summary Cards */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
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

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/budget')}
            >
              <span>View All Budgets</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/budget/report')}
            >
              <span>View Reports</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/budget/set')}
            >
              <span>Create New Budget</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BudgetInsightsPage;
