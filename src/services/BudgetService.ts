import { safeStorage } from "@/utils/safe-storage";
import { v4 as uuidv4 } from 'uuid';
import { Budget, CreateBudgetInput, UpdateBudgetInput, migrateBudget, DEFAULT_ALERT_THRESHOLDS } from '@/models/budget';
import { BudgetProgress, BudgetAlert } from '@/models/budget-period';
import { getCurrentPeriodDates, getDaysRemainingInPeriod, isWithinPeriod } from '@/utils/budget-period-utils';
import { transactionService } from './TransactionService';
import { Transaction, Category } from '@/types/transaction';

const STORAGE_KEY = 'xpensia_budgets';
const ALERTS_STORAGE_KEY = 'xpensia_budget_alerts';

// Cache for category tree traversal (invalidated on category changes)
let categoryTreeCache: Map<string, string[]> | null = null;

export class BudgetService {
  /**
   * Get all active budgets with migration for backward compatibility
   */
  getBudgets(): Budget[] {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      
      const parsed = JSON.parse(raw) as Partial<Budget>[];
      // Migrate each budget to ensure all fields have defaults
      return parsed
        .map(b => migrateBudget(b))
        .filter(b => b.isActive !== false); // Only return active budgets
    } catch {
      return [];
    }
  }

  /**
   * Get all budgets including inactive ones
   */
  getAllBudgets(): Budget[] {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      
      const parsed = JSON.parse(raw) as Partial<Budget>[];
      return parsed.map(b => migrateBudget(b));
    } catch {
      return [];
    }
  }

  /**
   * Get a single budget by ID
   */
  getBudgetById(id: string): Budget | null {
    const budgets = this.getAllBudgets();
    return budgets.find(b => b.id === id) || null;
  }

  /**
   * Get budgets filtered by scope
   */
  getBudgetsByScope(scope: Budget['scope']): Budget[] {
    return this.getBudgets().filter(b => b.scope === scope);
  }

  /**
   * Get budget for a specific period
   */
  getBudgetsByPeriod(period: Budget['period']): Budget[] {
    return this.getBudgets().filter(b => b.period === period);
  }

  /**
   * Add a new budget
   */
  addBudget(input: CreateBudgetInput): Budget {
    const now = new Date().toISOString();
    const budget: Budget = {
      ...input,
      id: uuidv4(),
      alertThresholds: input.alertThresholds ?? [...DEFAULT_ALERT_THRESHOLDS],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    
    const budgets = this.getAllBudgets();
    budgets.push(budget);
    this.saveBudgets(budgets);
    
    return budget;
  }

  /**
   * Update an existing budget
   */
  updateBudget(id: string, updates: UpdateBudgetInput): Budget | null {
    const budgets = this.getAllBudgets();
    const index = budgets.findIndex(b => b.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...budgets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    budgets[index] = updated;
    this.saveBudgets(budgets);
    
    return updated;
  }

  /**
   * Soft delete a budget (set isActive to false)
   */
  deleteBudget(id: string): boolean {
    return this.updateBudget(id, { isActive: false }) !== null;
  }

  /**
   * Hard delete a budget (permanent removal)
   */
  permanentlyDeleteBudget(id: string): boolean {
    const budgets = this.getAllBudgets();
    const filtered = budgets.filter(b => b.id !== id);
    
    if (filtered.length === budgets.length) return false;
    
    this.saveBudgets(filtered);
    return true;
  }

  /**
   * Save budgets to storage
   */
  private saveBudgets(budgets: Budget[]): void {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  }

  // ============ Spending Calculations ============

  /**
   * Get transactions for the current period of a budget
   */
  getTransactionsForBudget(budget: Budget): Transaction[] {
    const transactions = transactionService.getAllTransactions();
    const { start, end } = getCurrentPeriodDates(budget.period, budget.startDate);
    
    return transactions.filter(tx => {
      // Filter by date within period
      if (!isWithinPeriod(tx.date, start, end)) return false;
      
      // Filter by scope
      switch (budget.scope) {
        case 'overall':
          // Include all expense transactions
          return tx.type === 'expense' || tx.amount < 0;
        
        case 'account':
          return tx.fromAccount === budget.targetId || tx.account === budget.targetId;
        
        case 'category':
          // Include transactions from this category and all subcategories
          const categoryIds = this.getCategoryAndSubcategoryIds(budget.targetId);
          return categoryIds.includes(tx.category);
        
        case 'subcategory':
          return tx.subcategory === budget.targetId || tx.category === budget.targetId;
        
        default:
          return false;
      }
    });
  }

  /**
   * Get spent amount for a budget in the current period
   */
  getSpentAmount(budget: Budget): number {
    const transactions = this.getTransactionsForBudget(budget);
    
    // Sum up expense amounts (expenses are typically negative, so we use Math.abs)
    return transactions.reduce((sum, tx) => {
      const amount = Math.abs(tx.amount);
      // Only count expenses
      if (tx.type === 'expense' || tx.amount < 0) {
        return sum + amount;
      }
      return sum;
    }, 0);
  }

  /**
   * Get comprehensive budget progress
   */
  getBudgetProgress(budget: Budget): BudgetProgress {
    const spent = this.getSpentAmount(budget);
    const { start, end } = getCurrentPeriodDates(budget.period, budget.startDate);
    const daysRemaining = getDaysRemainingInPeriod(end);
    const remaining = Math.max(0, budget.amount - spent);
    const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    // Calculate daily budget remaining
    const dailyBudgetRemaining = daysRemaining > 0 ? remaining / daysRemaining : 0;
    
    // Determine which alert thresholds have been triggered
    const thresholds = budget.alertThresholds || DEFAULT_ALERT_THRESHOLDS;
    const triggeredAlerts = thresholds.filter(t => percentUsed >= t);
    
    return {
      budgetId: budget.id,
      budgeted: budget.amount,
      spent,
      remaining,
      percentUsed,
      periodStart: start,
      periodEnd: end,
      isOverBudget: spent > budget.amount,
      daysRemaining,
      dailyBudgetRemaining,
      triggeredAlerts,
    };
  }

  /**
   * Get all budgets with their progress calculated
   */
  getAllBudgetsWithProgress(): Array<Budget & { progress: BudgetProgress }> {
    const budgets = this.getBudgets();
    return budgets.map(budget => ({
      ...budget,
      progress: this.getBudgetProgress(budget),
    }));
  }

  /**
   * Get overall spending progress (sum of all budgets)
   */
  getOverallProgress(): BudgetProgress | null {
    const overallBudget = this.getBudgets().find(b => b.scope === 'overall');
    if (overallBudget) {
      return this.getBudgetProgress(overallBudget);
    }
    return null;
  }

  /**
   * Get category hierarchy progress (category + its subcategories)
   */
  getCategoryHierarchyProgress(categoryId: string): {
    categoryProgress: BudgetProgress | null;
    subcategoryProgresses: Array<{ id: string; name: string; progress: BudgetProgress }>;
    totalSpent: number;
    totalBudgeted: number;
  } {
    const budgets = this.getBudgets();
    const categories = transactionService.getCategories();
    
    // Find category budget
    const categoryBudget = budgets.find(
      b => b.scope === 'category' && b.targetId === categoryId
    );
    
    // Find subcategory budgets
    const subcategoryIds = this.getSubcategoryIds(categoryId);
    const subcategoryBudgets = budgets.filter(
      b => b.scope === 'subcategory' && subcategoryIds.includes(b.targetId)
    );
    
    const categoryProgress = categoryBudget 
      ? this.getBudgetProgress(categoryBudget) 
      : null;
    
    const subcategoryProgresses = subcategoryBudgets.map(budget => {
      const cat = categories.find(c => c.id === budget.targetId);
      return {
        id: budget.targetId,
        name: cat?.name || budget.targetId,
        progress: this.getBudgetProgress(budget),
      };
    });
    
    // Calculate totals
    const totalSpent = (categoryProgress?.spent || 0) + 
      subcategoryProgresses.reduce((sum, s) => sum + s.progress.spent, 0);
    const totalBudgeted = (categoryProgress?.budgeted || 0) +
      subcategoryProgresses.reduce((sum, s) => sum + s.progress.budgeted, 0);
    
    return {
      categoryProgress,
      subcategoryProgresses,
      totalSpent,
      totalBudgeted,
    };
  }

  // ============ Category Tree Helpers ============

  /**
   * Get all subcategory IDs for a category (with caching)
   */
  private getSubcategoryIds(categoryId: string): string[] {
    if (!categoryTreeCache) {
      this.buildCategoryTreeCache();
    }
    return categoryTreeCache?.get(categoryId) || [];
  }

  /**
   * Get category ID and all its subcategory IDs
   */
  private getCategoryAndSubcategoryIds(categoryId: string): string[] {
    return [categoryId, ...this.getSubcategoryIds(categoryId)];
  }

  /**
   * Build category tree cache for efficient traversal
   */
  private buildCategoryTreeCache(): void {
    const categories = transactionService.getCategories();
    categoryTreeCache = new Map();
    
    // Build parent -> children map
    const childrenMap = new Map<string, string[]>();
    categories.forEach(cat => {
      if (cat.parentId) {
        const children = childrenMap.get(cat.parentId) || [];
        children.push(cat.id);
        childrenMap.set(cat.parentId, children);
      }
    });
    
    // Recursively get all descendants
    const getAllDescendants = (id: string): string[] => {
      const children = childrenMap.get(id) || [];
      const descendants: string[] = [...children];
      children.forEach(childId => {
        descendants.push(...getAllDescendants(childId));
      });
      return descendants;
    };
    
    // Populate cache for all categories
    categories.forEach(cat => {
      categoryTreeCache!.set(cat.id, getAllDescendants(cat.id));
    });
  }

  /**
   * Invalidate category cache (call when categories change)
   */
  invalidateCategoryCache(): void {
    categoryTreeCache = null;
  }

  // ============ Alert Management ============

  /**
   * Get all budget alerts
   */
  getAlerts(): BudgetAlert[] {
    try {
      const raw = safeStorage.getItem(ALERTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check budgets and create/update alerts
   */
  checkBudgetAlerts(): BudgetAlert[] {
    const budgets = this.getBudgets();
    const existingAlerts = this.getAlerts();
    const newAlerts: BudgetAlert[] = [];
    
    budgets.forEach(budget => {
      const progress = this.getBudgetProgress(budget);
      const thresholds = budget.alertThresholds || DEFAULT_ALERT_THRESHOLDS;
      
      thresholds.forEach(threshold => {
        if (progress.percentUsed >= threshold) {
          // Check if this alert already exists
          const existingAlert = existingAlerts.find(
            a => a.budgetId === budget.id && a.threshold === threshold
          );
          
          if (!existingAlert) {
            newAlerts.push({
              budgetId: budget.id,
              threshold,
              percentUsed: progress.percentUsed,
              triggeredAt: new Date().toISOString(),
              dismissed: false,
            });
          } else if (!existingAlert.dismissed) {
            // Update existing undismissed alert
            newAlerts.push({
              ...existingAlert,
              percentUsed: progress.percentUsed,
            });
          } else {
            // Keep dismissed alerts as-is
            newAlerts.push(existingAlert);
          }
        }
      });
    });
    
    this.saveAlerts(newAlerts);
    return newAlerts.filter(a => !a.dismissed);
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(budgetId: string, threshold: number): void {
    const alerts = this.getAlerts();
    const updatedAlerts = alerts.map(alert => {
      if (alert.budgetId === budgetId && alert.threshold === threshold) {
        return {
          ...alert,
          dismissed: true,
          dismissedAt: new Date().toISOString(),
        };
      }
      return alert;
    });
    
    this.saveAlerts(updatedAlerts);
  }

  /**
   * Get active (undismissed) alerts
   */
  getActiveAlerts(): BudgetAlert[] {
    return this.getAlerts().filter(a => !a.dismissed);
  }

  /**
   * Save alerts to storage
   */
  private saveAlerts(alerts: BudgetAlert[]): void {
    safeStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }

  // ============ Legacy Compatibility ============

  /**
   * @deprecated Use getBudgetsByPeriod instead
   */
  getBudgetSummary(period: string) {
    return this.getBudgetsByPeriod(period as Budget['period']);
  }
}

export const budgetService = new BudgetService();
