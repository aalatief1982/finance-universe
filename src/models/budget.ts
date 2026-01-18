// Budget scope types - includes 'overall' as top-level scope
export type BudgetScope = 'overall' | 'category' | 'subcategory' | 'account';

// Budget period types (removed 'custom' - all periods are calendar-based)
export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// Default alert thresholds
export const DEFAULT_ALERT_THRESHOLDS = [50, 80, 100] as const;

export interface Budget {
  id: string;
  scope: BudgetScope;
  targetId: string;              // Empty for 'overall', category/subcategory/account ID otherwise
  amount: number;
  currency: string;
  period: BudgetPeriod;
  
  // Calendar-based period identification
  year: number;                    // e.g., 2025
  periodIndex?: number;            // Q1=1, Jan=1, Week 34=34, etc. (undefined for yearly)
  
  // Period hierarchy tracking
  isOverride: boolean;             // True if user manually set, false if auto-calculated
  parentBudgetId?: string;         // Links to parent period budget
  
  // Scope hierarchy tracking
  parentScopeBudgetId?: string;    // Links to parent scope budget (e.g., Category links to Overall)
  
  // Allocation tracking for scope hierarchy
  allocatedAmount?: number;        // How much of this budget is allocated to child scopes
  unallocatedAmount?: number;      // Remaining unallocated (amount - allocatedAmount)
  
  // Legacy fields (kept for backward compatibility during migration)
  startDate?: string;
  endDate?: string;
  
  rollover?: boolean;
  notes?: string;
  
  alertThresholds?: number[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Type for creating a new budget (id is auto-generated)
export type CreateBudgetInput = Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>;

// Type for updating a budget
export type UpdateBudgetInput = Partial<Omit<Budget, 'id' | 'createdAt'>>;

/**
 * Migrates old budget data to new format with defaults
 * Ensures backward compatibility when loading existing budgets
 */
export function migrateBudget(raw: Partial<Budget> & { scope?: string; period?: string }): Budget {
  const now = new Date().toISOString();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Handle scope - 'overall' is now valid again
  const rawScope = raw.scope as string;
  let scope: BudgetScope;
  if (rawScope === 'overall' || rawScope === 'category' || rawScope === 'subcategory' || rawScope === 'account') {
    scope = rawScope as BudgetScope;
  } else {
    scope = 'category'; // Default fallback
  }
  
  // Normalize targetId for 'overall' to a stable sentinel to avoid duplicates across versions
  let targetId = raw.targetId || '';
  if (scope === 'overall') targetId = '_overall';
  
  // Handle period migration: 'custom' becomes 'monthly'
  let period = raw.period as BudgetPeriod;
  if (period === 'custom' as any) {
    period = 'monthly';
  }
  
  // Determine year and periodIndex from startDate if not set
  let year = raw.year || currentYear;
  let periodIndex = raw.periodIndex;
  
  if (!raw.year && raw.startDate) {
    const startDate = new Date(raw.startDate);
    year = startDate.getFullYear();
    
    if (!periodIndex) {
      switch (period) {
        case 'weekly':
          // Approximate week number from date
          const startOfYear = new Date(year, 0, 1);
          const days = Math.floor((startDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          periodIndex = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          break;
        case 'monthly':
          periodIndex = startDate.getMonth() + 1;
          break;
        case 'quarterly':
          periodIndex = Math.ceil((startDate.getMonth() + 1) / 3);
          break;
        case 'yearly':
          periodIndex = undefined;
          break;
      }
    }
  }
  
  // Default periodIndex if not set
  if (periodIndex === undefined && period !== 'yearly') {
    periodIndex = period === 'monthly' ? currentMonth : 
                  period === 'quarterly' ? Math.ceil(currentMonth / 3) : 1;
  }
  
  return {
    id: raw.id || '',
    scope,
    targetId,
    amount: raw.amount ?? 0,
    currency: raw.currency || 'USD',
    period,
    year,
    periodIndex,
    isOverride: raw.isOverride ?? true, // Existing budgets are treated as overrides
    parentBudgetId: raw.parentBudgetId,
    parentScopeBudgetId: raw.parentScopeBudgetId,
    allocatedAmount: raw.allocatedAmount,
    unallocatedAmount: raw.unallocatedAmount,
    startDate: raw.startDate,
    endDate: raw.endDate,
    rollover: raw.rollover ?? false,
    notes: raw.notes || '',
    alertThresholds: raw.alertThresholds ?? [...DEFAULT_ALERT_THRESHOLDS],
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

/**
 * Generate a unique key for a budget (used to prevent duplicates)
 */
export function getBudgetKey(budget: Pick<Budget, 'scope' | 'targetId' | 'period' | 'year' | 'periodIndex'>): string {
  const normalizedTargetId = budget.scope === 'overall' ? '_overall' : budget.targetId;
  return `${budget.scope}:${normalizedTargetId}:${budget.period}:${budget.year}:${budget.periodIndex || ''}`;
}

/**
 * Check if a budget is for a specific period
 */
export function isBudgetForPeriod(
  budget: Budget,
  period: BudgetPeriod,
  year: number,
  periodIndex?: number
): boolean {
  if (budget.period !== period || budget.year !== year) return false;
  if (period === 'yearly') return true;
  return budget.periodIndex === periodIndex;
}

/**
 * Get scope hierarchy level (0 = overall, 1 = category, 2 = subcategory, 3 = account)
 */
export function getScopeLevel(scope: BudgetScope): number {
  const levels: Record<BudgetScope, number> = {
    overall: 0,
    category: 1,
    subcategory: 2,
    account: 3
  };
  return levels[scope];
}

/**
 * Check if a scope is a parent of another scope
 */
export function isScopeParentOf(parentScope: BudgetScope, childScope: BudgetScope): boolean {
  return getScopeLevel(parentScope) < getScopeLevel(childScope);
}
