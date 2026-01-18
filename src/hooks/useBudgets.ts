import { useState, useEffect, useCallback, useMemo } from 'react';
import { Budget, CreateBudgetInput, UpdateBudgetInput, BudgetPeriod } from '@/models/budget';
import { BudgetProgress, BudgetAlert } from '@/models/budget-period';
import { budgetService } from '@/services/BudgetService';

/**
 * Custom hook for budget management with reactive updates
 */
export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Load budgets on mount
  useEffect(() => {
    setBudgets(budgetService.getBudgets());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setBudgets(budgetService.getBudgets());
  }, []);

  const addBudget = useCallback((input: CreateBudgetInput): Budget => {
    const newBudget = budgetService.addBudget(input);
    refresh();
    return newBudget;
  }, [refresh]);

  const updateBudget = useCallback((id: string, updates: UpdateBudgetInput): Budget | null => {
    const updated = budgetService.updateBudget(id, updates);
    if (updated) refresh();
    return updated;
  }, [refresh]);

  const deleteBudget = useCallback((id: string): boolean => {
    const success = budgetService.deleteBudget(id);
    if (success) refresh();
    return success;
  }, [refresh]);

  return {
    budgets,
    loading,
    refresh,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}

/**
 * Hook for budget progress calculations
 */
export function useBudgetProgress(budgetId?: string) {
  const [progress, setProgress] = useState<BudgetProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!budgetId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const budget = budgetService.getBudgetById(budgetId);
    if (budget) {
      setProgress(budgetService.getBudgetProgress(budget));
    }
    setLoading(false);
  }, [budgetId]);

  return { progress, loading };
}

/**
 * Hook for all budgets with progress
 */
interface BudgetFilter {
  period?: BudgetPeriod;
  year?: number;
  periodIndex?: number;
}

export function useBudgetsWithProgress(filter?: BudgetPeriod | BudgetFilter) {
  const [data, setData] = useState<Array<Budget & { progress: BudgetProgress }>>([]);
  const [loading, setLoading] = useState(true);

  // Normalize filter to object form
  const normalizedFilter = useMemo((): BudgetFilter | undefined => {
    if (!filter) return undefined;
    if (typeof filter === 'string') return { period: filter };
    return filter;
  }, [filter]);

  const filterBudgets = useCallback((budgetsWithProgress: Array<Budget & { progress: BudgetProgress }>) => {
    if (!normalizedFilter) return budgetsWithProgress;
    
    return budgetsWithProgress.filter(b => {
      // Filter by period
      if (normalizedFilter.period && b.period !== normalizedFilter.period) {
        return false;
      }
      // Filter by year
      if (normalizedFilter.year && b.year !== normalizedFilter.year) {
        return false;
      }
      // Filter by periodIndex (only if not yearly)
      if (normalizedFilter.periodIndex !== undefined && b.period !== 'yearly') {
        if (b.periodIndex !== normalizedFilter.periodIndex) {
          return false;
        }
      }
      return true;
    });
  }, [normalizedFilter]);

  useEffect(() => {
    const budgetsWithProgress = budgetService.getAllBudgetsWithProgress();
    setData(filterBudgets(budgetsWithProgress));
    setLoading(false);
  }, [filterBudgets]);

  const refresh = useCallback(() => {
    const budgetsWithProgress = budgetService.getAllBudgetsWithProgress();
    setData(filterBudgets(budgetsWithProgress));
  }, [filterBudgets]);

  // Memoized calculations
  const summary = useMemo(() => {
    const totalBudgeted = data.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = data.reduce((sum, b) => sum + b.progress.spent, 0);
    const overBudgetCount = data.filter(b => b.progress.isOverBudget).length;
    
    return {
      totalBudgeted,
      totalSpent,
      totalRemaining: totalBudgeted - totalSpent,
      overallPercentUsed: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      budgetCount: data.length,
      overBudgetCount,
    };
  }, [data]);

  return { data, loading, refresh, summary };
}

/**
 * Hook for budget alerts
 */
export function useBudgetAlerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for new alerts on mount
    const activeAlerts = budgetService.checkBudgetAlerts();
    setAlerts(activeAlerts);
    setLoading(false);
  }, []);

  const dismissAlert = useCallback((budgetId: string, threshold: number) => {
    budgetService.dismissAlert(budgetId, threshold);
    setAlerts(prev => prev.filter(
      a => !(a.budgetId === budgetId && a.threshold === threshold)
    ));
  }, []);

  const refresh = useCallback(() => {
    const activeAlerts = budgetService.checkBudgetAlerts();
    setAlerts(activeAlerts);
  }, []);

  return { alerts, loading, dismissAlert, refresh };
}

/**
 * Hook for overall budget progress
 */
export function useOverallBudgetProgress() {
  const [progress, setProgress] = useState<BudgetProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const overall = budgetService.getOverallProgress();
    setProgress(overall);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    const overall = budgetService.getOverallProgress();
    setProgress(overall);
  }, []);

  return { progress, loading, refresh };
}
