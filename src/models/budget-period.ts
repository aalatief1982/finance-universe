/**
 * Tracks actual spending for a specific budget period.
 * Used for rollover calculations and historical tracking.
 */
export interface BudgetPeriodRecord {
  id: string;
  budgetId: string;
  periodStart: string; // ISO date string
  periodEnd: string;   // ISO date string
  allocatedAmount: number;
  spentAmount: number;
  rolledOverAmount: number; // Amount rolled over from previous period
  createdAt: string;
  updatedAt: string;
}

/**
 * Budget progress calculation result
 */
export interface BudgetProgress {
  budgetId: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  periodStart: Date;
  periodEnd: Date;
  isOverBudget: boolean;
  daysRemaining: number;
  dailyBudgetRemaining: number;
  triggeredAlerts: number[]; // Alert thresholds that have been exceeded
}

/**
 * Alert status for a budget
 */
export interface BudgetAlert {
  budgetId: string;
  threshold: number;
  percentUsed: number;
  triggeredAt: string;
  dismissed: boolean;
  dismissedAt?: string;
}
