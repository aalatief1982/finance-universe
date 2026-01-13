// Budget scope types
export type BudgetScope = 'overall' | 'account' | 'category' | 'subcategory';

// Budget period types
export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

// Default alert thresholds
export const DEFAULT_ALERT_THRESHOLDS = [50, 80, 100] as const;

export interface Budget {
  id: string;
  scope: BudgetScope;
  targetId: string; // Empty string for 'overall' scope
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  rollover?: boolean;
  notes?: string;
  
  // New fields with defaults for backward compatibility
  alertThresholds?: number[]; // Default: [50, 80, 100]
  isActive?: boolean; // Default: true
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
export function migrateBudget(raw: Partial<Budget>): Budget {
  const now = new Date().toISOString();
  
  return {
    id: raw.id || '',
    scope: raw.scope || 'category',
    targetId: raw.targetId || '',
    amount: raw.amount ?? 0,
    currency: raw.currency || 'USD',
    period: raw.period || 'monthly',
    startDate: raw.startDate || new Date().toISOString().split('T')[0],
    endDate: raw.endDate,
    rollover: raw.rollover ?? false,
    notes: raw.notes || '',
    // New fields with defaults
    alertThresholds: raw.alertThresholds ?? [...DEFAULT_ALERT_THRESHOLDS],
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}
