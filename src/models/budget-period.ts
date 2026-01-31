/**
 * @file budget-period.ts
 * @description Budget period record, progress, and alert interfaces.
 *
 * @module models/budget-period
 *
 * @responsibilities
 * 1. Define stored records for period spending/rollover
 * 2. Define computed progress structure for UI consumption
 * 3. Define alert payloads for threshold tracking
 *
 * @review-tags
 * - @data-contract: shared across budget services and UI
 *
 * @review-checklist
 * - [ ] Period dates use ISO strings for persistence
 * - [ ] Progress values remain normalized (percentUsed 0-100+)
 */

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
