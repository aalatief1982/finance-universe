// Budget scope types (removed 'overall' - yearly serves this purpose)
export type BudgetScope = 'account' | 'category' | 'subcategory';

// Budget period types (removed 'custom' - all periods are calendar-based)
export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// Default alert thresholds
export const DEFAULT_ALERT_THRESHOLDS = [50, 80, 100] as const;

export interface Budget {
  id: string;
  scope: BudgetScope;
  targetId: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  
  // Calendar-based period identification
  year: number;                    // e.g., 2025
  periodIndex?: number;            // Q1=1, Jan=1, Week 34=34, etc. (undefined for yearly)
  
  // Hierarchy and override tracking
  isOverride: boolean;             // True if user manually set, false if auto-calculated
  parentBudgetId?: string;         // Links to parent period budget
  
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
  
  // Handle scope migration: 'overall' becomes 'category' with empty targetId
  // Use string comparison since raw.scope may contain legacy values
  const rawScope = raw.scope as string;
  let scope: BudgetScope = rawScope === 'overall' ? 'category' : (rawScope as BudgetScope) || 'category';
  let targetId = raw.targetId || (rawScope === 'overall' ? '_overall_legacy' : '');
  
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
  return `${budget.scope}:${budget.targetId}:${budget.period}:${budget.year}:${budget.periodIndex || ''}`;
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
