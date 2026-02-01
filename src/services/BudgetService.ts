/**
 * @file BudgetService.ts
 * @description Centralized service for budget management including CRUD operations,
 *              spending calculations, progress tracking, and alert management.
 * 
 * @module services/BudgetService
 * 
 * @responsibilities
 * 1. Budget CRUD with soft-delete and migration support
 * 2. Period-based budget retrieval (weekly, monthly, yearly)
 * 3. Spending calculations with transfer exclusion
 * 4. Budget progress tracking with threshold alerts
 * 5. Category hierarchy budget aggregation
 * 6. Alert creation, dismissal, and persistence
 * 
 * @storage-keys
 * - xpensia_budgets: Budget definitions
 * - xpensia_budget_alerts: Triggered alerts
 * 
 * @dependencies
 * - TransactionService.ts: Transaction queries for spending
 * - budget-period-utils.ts: Date range calculations
 * - budget.ts (model): Budget type and migration logic
 * 
 * @review-checklist
 * - [ ] Transfer exclusion in spending calculations (lines 262-268)
 * - [ ] Category tree cache invalidation
 * - [ ] Alert threshold duplicate prevention
 * - [ ] Period date range accuracy
 * 
 * @created 2024
 * @modified 2025-01-30
 */

import { safeStorage } from "@/utils/safe-storage";
import { v4 as uuidv4 } from 'uuid';
import { Budget, CreateBudgetInput, UpdateBudgetInput, migrateBudget, DEFAULT_ALERT_THRESHOLDS, getBudgetKey } from '@/models/budget';
import { BudgetProgress, BudgetAlert } from '@/models/budget-period';
import { getCurrentPeriodDates, getPeriodDates, getDaysRemainingInPeriod, isWithinPeriod, getCurrentPeriodInfo } from '@/utils/budget-period-utils';
import { transactionService } from './TransactionService';
import { Transaction, Category } from '@/types/transaction';
import { initBudgetMigrations } from '@/utils/budget-migration';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

const STORAGE_KEY = 'xpensia_budgets';
const ALERTS_STORAGE_KEY = 'xpensia_budget_alerts';

/**
 * Cache for category tree traversal.
 * Invalidated when categories change via invalidateCategoryCache().
 * 
 * @review-perf Prevents repeated tree traversal for hierarchy lookups
 */
let categoryTreeCache: Map<string, string[]> | null = null;

// Run migrations on module load
initBudgetMigrations();

export class BudgetService {

  // ============================================================================
  // SECTION: Budget Retrieval with Migration
  // PURPOSE: Load budgets with backward compatibility migration and de-duplication
  // REVIEW: Verify migration handles all legacy formats
  // ============================================================================

  /**
   * Get all active budgets with migration applied.
   * De-duplicates by logical key (handles legacy targetId variations).
   * 
   * @returns Array of active, migrated budgets
   * 
   * @review-focus
   * - Migration applied to each budget (line 75)
   * - De-duplication by getBudgetKey (lines 79-94)
   * - Only returns active budgets (isActive !== false)
   */
  getBudgets(): Budget[] {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Partial<Budget>[];

      const migrated = parsed
        .map(b => migrateBudget(b))
        .filter(b => b.isActive !== false); // Only return active budgets

      // De-duplicate by logical key (handles legacy overall targetId differences like '' vs '_overall')
      const byKey = new Map<string, Budget>();
      for (const b of migrated) {
        const key = getBudgetKey(b);
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, b);
          continue;
        }

        // Keep the more recently updated budget
        const existingTime = Date.parse(existing.updatedAt ?? existing.createdAt ?? '') || 0;
        const bTime = Date.parse(b.updatedAt ?? b.createdAt ?? '') || 0;

        if (bTime >= existingTime) {
          byKey.set(key, b);
        }
      }

      return Array.from(byKey.values());
    } catch {
      return [];
    }
  }

  /**
   * Get all budgets including inactive ones.
   * Used for admin/export purposes.
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
   * Get a single budget by ID.
   */
  getBudgetById(id: string): Budget | null {
    const budgets = this.getAllBudgets();
    return budgets.find(b => b.id === id) || null;
  }

  /**
   * Get budgets filtered by scope (overall, category, subcategory, account).
   */
  getBudgetsByScope(scope: Budget['scope']): Budget[] {
    return this.getBudgets().filter(b => b.scope === scope);
  }

  /**
   * Get budgets filtered by period type.
   */
  getBudgetsByPeriod(period: Budget['period']): Budget[] {
    return this.getBudgets().filter(b => b.period === period);
  }

  /**
   * Get budgets for a specific year and period index.
   * 
   * @param period - Period type (weekly, monthly, yearly)
   * @param year - Target year
   * @param periodIndex - Week/month index (optional for yearly)
   */
  getBudgetsForPeriod(period: Budget['period'], year: number, periodIndex?: number): Budget[] {
    return this.getBudgets().filter(b => {
      if (b.period !== period || b.year !== year) return false;
      if (period === 'yearly') return true;
      return b.periodIndex === periodIndex;
    });
  }

  // ============================================================================
  // SECTION: Budget CRUD Operations
  // PURPOSE: Create, update, soft-delete, and hard-delete budgets
  // REVIEW: Verify duplicate detection and analytics logging
  // ============================================================================

  /**
   * Add a new budget with duplicate detection.
   * If a budget with same key exists, updates it instead.
   * 
   * @param input - Budget creation input
   * @returns Created or updated budget
   * 
   * @review-focus
   * - Duplicate detection by getBudgetKey (lines 160-170)
   * - Default alert thresholds applied if not provided
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
    
    // Check for existing budget with same key
    const existingIndex = budgets.findIndex(b => 
      getBudgetKey(b) === getBudgetKey(budget) && b.isActive
    );
    
    if (existingIndex !== -1) {
      // Update existing instead of creating duplicate
      budgets[existingIndex] = { ...budgets[existingIndex], ...budget, id: budgets[existingIndex].id };
      this.saveBudgets(budgets);
      return budgets[existingIndex];
    }
    
    budgets.push(budget);
    this.saveBudgets(budgets);
    
    // Log analytics event
    logAnalyticsEvent('budget_create', {
      scope: budget.scope,
      period: budget.period,
      amount: budget.amount,
      currency: budget.currency
    });
    
    return budget;
  }

  /**
   * Update an existing budget.
   * 
   * @param id - Budget ID to update
   * @param updates - Partial budget fields
   * @returns Updated budget or null if not found
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
    
    // Log analytics event
    logAnalyticsEvent('budget_edit', {
      budget_id: id,
      scope: updated.scope,
      period: updated.period,
      amount: updated.amount
    });
    
    return updated;
  }

  /**
   * Soft delete a budget (sets isActive to false).
   * Budget remains in storage for history/audit.
   * 
   * @param id - Budget ID to soft-delete
   * @returns true if found and deactivated
   */
  deleteBudget(id: string): boolean {
    return this.updateBudget(id, { isActive: false }) !== null;
  }

  /**
   * Hard delete a budget (permanent removal).
   * Use with caution - no recovery possible.
   * 
   * @param id - Budget ID to permanently delete
   * @returns true if found and removed
   */
  permanentlyDeleteBudget(id: string): boolean {
    const budgets = this.getAllBudgets();
    const filtered = budgets.filter(b => b.id !== id);
    
    if (filtered.length === budgets.length) return false;
    
    this.saveBudgets(filtered);
    return true;
  }

  /**
   * Persist budgets to storage.
   */
  private saveBudgets(budgets: Budget[]): void {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  }

  // ============================================================================
  // SECTION: Spending Calculations
  // PURPOSE: Calculate actual spending for budget progress (EXCLUDES transfers)
  // REVIEW: Critical - transfers MUST be excluded from spending totals
  // ============================================================================

  /**
   * Get transactions that apply to a budget's scope and period.
   * 
   * @param budget - Budget to get transactions for
   * @returns Filtered transactions within budget scope and period
   * 
   * @review-focus
   * - Period date range filtering (line 264)
   * - Scope-based filtering (lines 267-284)
   * - Overall scope ONLY includes expenses (NOT transfers) (line 271)
   */
  getTransactionsForBudget(budget: Budget): Transaction[] {
    const transactions = transactionService.getAllTransactions();
    
    // Use calendar-based period dates
    const { start, end } = getPeriodDates(budget.period, budget.year, budget.periodIndex);
    
    return transactions.filter(tx => {
      // Filter by date within period
      if (!isWithinPeriod(tx.date, start, end)) return false;
      
      // Filter by scope
      switch (budget.scope) {
        case 'overall':
          // @review-risk Include ONLY expense transactions (NOT transfers)
          return tx.type === 'expense';
        
        case 'account':
          return tx.fromAccount === budget.targetId || tx.account === budget.targetId;
        
        case 'category': {
          // Include transactions from this category and all subcategories
          const categoryIds = this.getCategoryAndSubcategoryIds(budget.targetId);
          return categoryIds.includes(tx.category);
        }
        
        case 'subcategory':
          return tx.subcategory === budget.targetId || tx.category === budget.targetId;
        
        default:
          return false;
      }
    });
  }

  /**
   * Get total spent amount for a budget in current period.
   * 
   * @param budget - Budget to calculate spending for
   * @returns Total spent amount (positive number)
   * 
   * @review-focus
   * - Only counts tx.type === 'expense' (line 303)
   * - Uses Math.abs to ensure positive spending value
   * - Transfers are EXCLUDED (filtered in getTransactionsForBudget)
   */
  getSpentAmount(budget: Budget): number {
    const transactions = this.getTransactionsForBudget(budget);
    
    // Sum up expense amounts (expenses are typically negative, so we use Math.abs)
    // Only count actual expenses, NOT transfers
    return transactions.reduce((sum, tx) => {
      if (tx.type === 'expense') {
        return sum + Math.abs(tx.amount);
      }
      return sum;
    }, 0);
  }

  // ============================================================================
  // SECTION: Budget Progress Tracking
  // PURPOSE: Calculate comprehensive progress metrics for budgets
  // REVIEW: Verify percentage calculations and alert triggering
  // ============================================================================

  /**
   * Get comprehensive budget progress metrics.
   * 
   * @param budget - Budget to calculate progress for
   * @returns BudgetProgress object with all metrics
   * 
   * @review-focus
   * - percentUsed calculation (line 327)
   * - dailyBudgetRemaining for pacing (line 330)
   * - triggeredAlerts based on thresholds (lines 333-334)
   */
  getBudgetProgress(budget: Budget): BudgetProgress {
    const spent = this.getSpentAmount(budget);
    const { start, end } = getPeriodDates(budget.period, budget.year, budget.periodIndex);
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
   * Get all budgets with their progress calculated.
   * Convenience method for dashboard display.
   */
  getAllBudgetsWithProgress(): Array<Budget & { progress: BudgetProgress }> {
    const budgets = this.getBudgets();
    return budgets.map(budget => ({
      ...budget,
      progress: this.getBudgetProgress(budget),
    }));
  }

  /**
   * Get aggregated yearly budget progress.
   * Combines all yearly budgets for a given year.
   * 
   * @param year - Target year (defaults to current year)
   * @returns Aggregated progress or null if no yearly budgets exist
   */
  getYearlyProgress(year?: number): BudgetProgress | null {
    const targetYear = year || new Date().getFullYear();
    const yearlyBudgets = this.getBudgets().filter(
      b => b.period === 'yearly' && b.year === targetYear
    );
    
    if (yearlyBudgets.length === 0) return null;
    
    // Aggregate all yearly budgets
    const totalBudgeted = yearlyBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = yearlyBudgets.reduce((sum, b) => sum + this.getSpentAmount(b), 0);
    
    const { start, end } = getPeriodDates('yearly', targetYear);
    const daysRemaining = getDaysRemainingInPeriod(end);
    const remaining = Math.max(0, totalBudgeted - totalSpent);
    const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    
    return {
      budgetId: 'yearly-aggregate',
      budgeted: totalBudgeted,
      spent: totalSpent,
      remaining,
      percentUsed,
      periodStart: start,
      periodEnd: end,
      isOverBudget: totalSpent > totalBudgeted,
      daysRemaining,
      dailyBudgetRemaining: daysRemaining > 0 ? remaining / daysRemaining : 0,
      triggeredAlerts: [],
    };
  }

  /**
   * Get hierarchical progress for a category and its subcategories.
   * 
   * @param categoryId - Root category ID
   * @returns Category progress plus array of subcategory progresses
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

  // ============================================================================
  // SECTION: Category Tree Helpers
  // PURPOSE: Efficient category hierarchy traversal with caching
  // REVIEW: Verify cache invalidation is called on category changes
  // ============================================================================

  /**
   * Get all subcategory IDs for a category (with caching).
   * 
   * @param categoryId - Parent category ID
   * @returns Array of direct and indirect subcategory IDs
   */
  private getSubcategoryIds(categoryId: string): string[] {
    if (!categoryTreeCache) {
      this.buildCategoryTreeCache();
    }
    return categoryTreeCache?.get(categoryId) || [];
  }

  /**
   * Get category ID and all its subcategory IDs.
   * Convenience wrapper for budget scope filtering.
   */
  private getCategoryAndSubcategoryIds(categoryId: string): string[] {
    return [categoryId, ...this.getSubcategoryIds(categoryId)];
  }

  /**
   * Build category tree cache for efficient traversal.
   * 
   * @review-perf One-time build, reused until invalidated
   * @review-risk Assumes no circular references in category hierarchy
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
   * Invalidate category cache.
   * MUST be called when categories are added, updated, or deleted.
   * 
   * @review-focus Ensure TransactionService calls this on category changes
   */
  invalidateCategoryCache(): void {
    categoryTreeCache = null;
  }

  // ============================================================================
  // SECTION: Alert Management
  // PURPOSE: Track and manage budget threshold alerts
  // REVIEW: Verify alert deduplication and dismissal persistence
  // ============================================================================

  /**
   * Get all budget alerts from storage.
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
   * Check all budgets and create/update alerts for threshold breaches.
   * 
   * @returns Array of active (undismissed) alerts
   * 
   * @review-focus
   * - Prevents duplicate alerts for same budget+threshold (lines 515-520)
   * - Preserves dismissed state (lines 530-533)
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
            // Create new alert
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
   * Dismiss an alert for a specific budget and threshold.
   * 
   * @param budgetId - Budget ID
   * @param threshold - Threshold value that was triggered
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
   * Get only active (undismissed) alerts.
   */
  getActiveAlerts(): BudgetAlert[] {
    return this.getAlerts().filter(a => !a.dismissed);
  }

  /**
   * Persist alerts to storage.
   */
  private saveAlerts(alerts: BudgetAlert[]): void {
    safeStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }

  // ============================================================================
  // SECTION: Legacy Compatibility
  // PURPOSE: Deprecated methods for backward compatibility
  // REVIEW: Remove these in a future major version
  // ============================================================================

  /**
   * @deprecated Use getBudgetsByPeriod instead
   */
  getBudgetSummary(period: string) {
    return this.getBudgetsByPeriod(period as Budget['period']);
  }

  /**
   * @deprecated Use getYearlyProgress instead
   */
  getOverallProgress(): BudgetProgress | null {
    return this.getYearlyProgress();
  }
}

export const budgetService = new BudgetService();
