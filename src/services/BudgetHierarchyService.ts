import { Budget, BudgetPeriod, BudgetScope } from '@/models/budget';
import { getWeeksInMonth, getMonthsInQuarter, getWeeksInYear } from '@/utils/budget-period-utils';

/**
 * Service for managing budget hierarchy and distribution/aggregation
 */

export interface DistributionResult {
  amounts: number[];
  indices: number[];
}

/**
 * Distribute a yearly budget amount to quarters
 */
export function distributeYearlyToQuarters(yearlyAmount: number): DistributionResult {
  const quarterAmount = yearlyAmount / 4;
  return {
    amounts: [quarterAmount, quarterAmount, quarterAmount, quarterAmount],
    indices: [1, 2, 3, 4],
  };
}

/**
 * Distribute a quarterly budget amount to months
 */
export function distributeQuarterlyToMonths(quarterlyAmount: number, quarter: number): DistributionResult {
  const monthAmount = quarterlyAmount / 3;
  const months = getMonthsInQuarter(quarter);
  return {
    amounts: [monthAmount, monthAmount, monthAmount],
    indices: months,
  };
}

/**
 * Distribute a monthly budget amount to weeks
 */
export function distributeMonthlyToWeeks(
  monthlyAmount: number, 
  year: number, 
  month: number
): DistributionResult {
  const weeksInMonth = getWeeksInMonth(year, month);
  const weekAmount = monthlyAmount / weeksInMonth;
  
  // Generate week indices for this month (approximate)
  // This is simplified - in reality we'd need to track which weeks fall in this month
  const indices: number[] = [];
  for (let i = 0; i < weeksInMonth; i++) {
    indices.push(i + 1); // These are relative week indices within the month
  }
  
  return {
    amounts: Array(weeksInMonth).fill(weekAmount),
    indices,
  };
}

/**
 * Aggregate week budgets to monthly total
 */
export function aggregateWeeksToMonth(weekBudgets: Budget[]): number {
  return weekBudgets.reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Aggregate month budgets to quarterly total
 */
export function aggregateMonthsToQuarter(monthBudgets: Budget[], quarter: number): number {
  const months = getMonthsInQuarter(quarter);
  return monthBudgets
    .filter(b => b.periodIndex && months.includes(b.periodIndex))
    .reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Aggregate quarter budgets to yearly total
 */
export function aggregateQuartersToYear(quarterBudgets: Budget[]): number {
  return quarterBudgets.reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Get the parent period type for a given period
 */
export function getParentPeriod(period: BudgetPeriod): BudgetPeriod | null {
  switch (period) {
    case 'weekly':
      return 'monthly';
    case 'monthly':
      return 'quarterly';
    case 'quarterly':
      return 'yearly';
    case 'yearly':
      return null;
    default:
      return null;
  }
}

/**
 * Get the child period type for a given period
 */
export function getChildPeriod(period: BudgetPeriod): BudgetPeriod | null {
  switch (period) {
    case 'yearly':
      return 'quarterly';
    case 'quarterly':
      return 'monthly';
    case 'monthly':
      return 'weekly';
    case 'weekly':
      return null;
    default:
      return null;
  }
}

/**
 * Get which parent period index a child belongs to
 */
export function getParentPeriodIndex(
  childPeriod: BudgetPeriod, 
  childPeriodIndex: number
): number | undefined {
  switch (childPeriod) {
    case 'monthly':
      // Month 1-3 -> Q1, 4-6 -> Q2, etc.
      return Math.ceil(childPeriodIndex / 3);
    case 'quarterly':
      // All quarters belong to the same year
      return undefined; // Yearly has no periodIndex
    default:
      return undefined;
  }
}

/**
 * Get all child period indices for a parent period
 */
export function getChildPeriodIndices(
  parentPeriod: BudgetPeriod,
  parentPeriodIndex: number | undefined,
  year: number
): number[] {
  switch (parentPeriod) {
    case 'yearly':
      return [1, 2, 3, 4]; // Q1-Q4
    
    case 'quarterly':
      return getMonthsInQuarter(parentPeriodIndex || 1);
    
    case 'monthly':
      // Get week numbers for this month
      const weeksInMonth = getWeeksInMonth(year, parentPeriodIndex || 1);
      return Array.from({ length: weeksInMonth }, (_, i) => i + 1);
    
    default:
      return [];
  }
}

/**
 * Calculate what a budget should be based on higher-level budgets
 */
export function calculateDerivedBudgetAmount(
  parentBudget: Budget,
  targetPeriod: BudgetPeriod,
  targetPeriodIndex: number,
  year: number
): number {
  switch (parentBudget.period) {
    case 'yearly': {
      if (targetPeriod === 'quarterly') {
        return parentBudget.amount / 4;
      }
      if (targetPeriod === 'monthly') {
        return parentBudget.amount / 12;
      }
      if (targetPeriod === 'weekly') {
        return parentBudget.amount / getWeeksInYear(year);
      }
      break;
    }
    
    case 'quarterly': {
      if (targetPeriod === 'monthly') {
        return parentBudget.amount / 3;
      }
      if (targetPeriod === 'weekly') {
        // Approximate weeks in quarter
        return parentBudget.amount / 13;
      }
      break;
    }
    
    case 'monthly': {
      if (targetPeriod === 'weekly') {
        const weeksInMonth = getWeeksInMonth(year, parentBudget.periodIndex || 1);
        return parentBudget.amount / weeksInMonth;
      }
      break;
    }
  }
  
  return parentBudget.amount;
}

/**
 * Find budgets that need to be updated when a budget changes
 */
export function findAffectedBudgets(
  changedBudget: Budget,
  allBudgets: Budget[]
): {
  parentBudgets: Budget[];
  childBudgets: Budget[];
  siblingBudgets: Budget[];
} {
  const parentBudgets: Budget[] = [];
  const childBudgets: Budget[] = [];
  const siblingBudgets: Budget[] = [];
  
  const matchingBudgets = allBudgets.filter(
    b => b.scope === changedBudget.scope && 
         b.targetId === changedBudget.targetId &&
         b.year === changedBudget.year &&
         b.id !== changedBudget.id
  );
  
  const parentPeriod = getParentPeriod(changedBudget.period);
  const childPeriod = getChildPeriod(changedBudget.period);
  
  matchingBudgets.forEach(budget => {
    if (budget.period === parentPeriod) {
      // Check if this is the correct parent
      const parentIndex = getParentPeriodIndex(changedBudget.period, changedBudget.periodIndex || 1);
      if (budget.periodIndex === parentIndex || (budget.period === 'yearly' && parentPeriod === 'yearly')) {
        parentBudgets.push(budget);
      }
    } else if (budget.period === childPeriod) {
      // Check if this child belongs to the changed budget
      const childParentIndex = getParentPeriodIndex(budget.period, budget.periodIndex || 1);
      if (childParentIndex === changedBudget.periodIndex || changedBudget.period === 'yearly') {
        childBudgets.push(budget);
      }
    } else if (budget.period === changedBudget.period) {
      siblingBudgets.push(budget);
    }
  });
  
  return { parentBudgets, childBudgets, siblingBudgets };
}

export const budgetHierarchyService = {
  distributeYearlyToQuarters,
  distributeQuarterlyToMonths,
  distributeMonthlyToWeeks,
  aggregateWeeksToMonth,
  aggregateMonthsToQuarter,
  aggregateQuartersToYear,
  getParentPeriod,
  getChildPeriod,
  getParentPeriodIndex,
  getChildPeriodIndices,
  calculateDerivedBudgetAmount,
  findAffectedBudgets,
};
