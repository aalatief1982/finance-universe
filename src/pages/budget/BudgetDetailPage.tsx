import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { BudgetBreadcrumb } from '@/components/budget/BudgetBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { formatCurrency } from '@/utils/format-utils';
import { formatPeriodRange, getPeriodLabel, formatPeriodLabel } from '@/utils/budget-period-utils';
import { SpendingTrendChart } from '@/components/budget/SpendingTrendChart';
import { BudgetProgressCard } from '@/components/budget/BudgetProgressCard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Edit, 
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ChevronRight,
  RotateCcw,
  Bell
} from 'lucide-react';

const BudgetDetailPage = () => {
  const { budgetId } = useParams();
  const navigate = useNavigate();

  // Load budget data
  const budget = React.useMemo(() => {
    if (!budgetId) return null;
    return budgetService.getBudgetById(budgetId);
  }, [budgetId]);

  const progress = React.useMemo(() => {
    if (!budget) return null;
    return budgetService.getBudgetProgress(budget);
  }, [budget]);

  const transactions = React.useMemo(() => {
    if (!budget) return [];
    return budgetService.getTransactionsForBudget(budget);
  }, [budget]);

  // Get subcategory budgets if this is a category budget
  const subcategoryBudgets = React.useMemo(() => {
    if (!budget || budget.scope !== 'category') return [];
    
    const allBudgets = budgetService.getAllBudgetsWithProgress();
    const categories = transactionService.getCategories();
    const subcatIds = categories
      .filter(c => c.parentId === budget.targetId)
      .map(c => c.id);
    
    return allBudgets.filter(
      b => b.scope === 'subcategory' && subcatIds.includes(b.targetId)
    );
  }, [budget]);

  // Get target name
  const targetName = React.useMemo(() => {
    if (!budget) return '';
    
    const accounts = accountService.getAccounts();
    const categories = transactionService.getCategories();
    const allTargets = [...accounts, ...categories];
    const target = allTargets.find((t: any) => t.id === budget.targetId);
    return target ? (target as any).name : budget.targetId;
  }, [budget]);

  // Get subcategory names
  const getSubcategoryName = (id: string) => {
    const categories = transactionService.getCategories();
    const cat = categories.find(c => c.id === id);
    return cat?.name || id;
  };

  if (!budget || !progress) {
    return (
      <Layout showBack>
        <div className="container px-4 py-12 text-center">
          <p className="text-muted-foreground">Budget not found</p>
          <Button onClick={() => navigate('/budget')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Budgets
          </Button>
        </div>
      </Layout>
    );
  }

  const { spent, budgeted, remaining, percentUsed, isOverBudget, daysRemaining, dailyBudgetRemaining, periodStart, periodEnd } = progress;

  // Progress bar color
  const getProgressColor = () => {
    if (percentUsed >= 100) return 'bg-destructive';
    if (percentUsed >= 80) return 'bg-amber-500';
    if (percentUsed >= 50) return 'bg-accent';
    return 'bg-primary';
  };

  // Build breadcrumb items
  const breadcrumbItems = React.useMemo(() => {
    const periodLabel = formatPeriodLabel(budget.period, budget.year, budget.periodIndex);
    return [
      { label: 'Budgets', path: '/budget' },
      { label: periodLabel, path: '/budget' },
      { label: targetName },
    ];
  }, [budget, targetName]);

  return (
    <Layout showBack>
      <div className="container px-4 py-6 pb-24 space-y-6 max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <BudgetBreadcrumb items={breadcrumbItems} className="mb-2" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{targetName}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatPeriodRange(periodStart, periodEnd)}</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/budget/set?edit=${budget.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Main Progress Card */}
        <Card className={cn(
          "relative overflow-hidden",
          isOverBudget && "border-destructive"
        )}>
          {isOverBudget && (
            <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
          )}
          <CardContent className="pt-6">
            {/* Amount Display */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold">
                {formatCurrency(spent, budget.currency)}
              </div>
              <div className="text-muted-foreground mt-1">
                of {formatCurrency(budgeted, budget.currency)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className={cn(
                  "font-medium",
                  isOverBudget ? "text-destructive" : "text-foreground"
                )}>
                  {Math.round(percentUsed)}% used
                </span>
                <span className="text-muted-foreground">
                  {isOverBudget 
                    ? `${formatCurrency(Math.abs(remaining), budget.currency)} over`
                    : `${formatCurrency(remaining, budget.currency)} left`
                  }
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getProgressColor())}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">Days Left</span>
                </div>
                <div className="text-lg font-semibold">{daysRemaining}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span className="text-xs">Daily Limit</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(dailyBudgetRemaining, budget.currency)}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs">Transactions</span>
                </div>
                <div className="text-lg font-semibold">{transactions.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Period</span>
              </div>
              <Badge variant="outline">{getPeriodLabel(budget.period)}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rollover</span>
              </div>
              <Badge variant={budget.rollover ? 'default' : 'secondary'}>
                {budget.rollover ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Alerts</span>
              </div>
              <div className="flex gap-1">
                {(budget.alertThresholds || [50, 80, 100]).map(t => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}%
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spending Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Spending Trend</CardTitle>
            <CardDescription>
              Cumulative spending vs. target pace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingTrendChart 
              budget={budget}
              progress={progress}
              transactions={transactions}
            />
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-destructive" />
                <span className="text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-primary" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">Target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-destructive opacity-50" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">Limit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subcategory Budgets (for category scope) */}
        {subcategoryBudgets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Subcategory Budgets</CardTitle>
              <CardDescription>
                Breakdown by subcategory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subcategoryBudgets.map(sub => (
                <BudgetProgressCard
                  key={sub.id}
                  budget={sub}
                  progress={sub.progress}
                  targetName={getSubcategoryName(sub.targetId)}
                  onClick={() => navigate(`/budget/${sub.id}`)}
                  compact
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/transactions')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No transactions in this period
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map(tx => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{tx.title || tx.description || 'Transaction'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(Math.abs(tx.amount), budget.currency)}
                    </span>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{transactions.length - 5} more transactions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {budget.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{budget.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default BudgetDetailPage;
