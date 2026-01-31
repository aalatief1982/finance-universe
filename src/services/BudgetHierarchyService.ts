/**
 * @file BudgetHierarchyService.ts
 * @description Helpers for distributing and aggregating budget amounts
 *              across period and scope hierarchies.
 *
 * @module services/BudgetHierarchyService
 *
 * @responsibilities
 * 1. Distribute budgets down period hierarchies (yearly → weekly)
 * 2. Aggregate child budgets to parent totals
 * 3. Provide utilities for parent/child period relationships
 *
 * @dependencies
 * - budget-period-utils.ts: week/month/quarter calculations
 * - models/budget: period and scope definitions
 *
 * @review-tags
 * - @risk: incorrect period indexing breaks allocations
 * - @data-integrity: aggregate totals must match parent sums
 *
 * @review-checklist
 * - [ ] Period indices are 1-based for months/quarters
 * - [ ] Weekly distributions respect weeks-in-month/year
 * - [ ] Parent/child period mapping is consistent
 */

import { Budget, BudgetPeriod, BudgetScope, getScopeLevel } from '@/models/budget';
import { getWeeksInMonth, getMonthsInQuarter, getWeeksInYear } from '@/utils/budget-period-utils';

/**
 * Service for managing budget hierarchy and distribution/aggregation
 * Supports both period hierarchy (yearly → quarterly → monthly → weekly)
 * and scope hierarchy (overall → category → subcategory → account)
 */

export interface DistributionResult {
  amounts: number[];
  indices: number[];
}

// ==========================================
// PERIOD DISTRIBUTION FUNCTIONS
// ==========================================

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
  
  const indices: number[] = [];
  for (let i = 0; i < weeksInMonth; i++) {
    indices.push(i + 1);
  }
  
  return {
    amounts: Array(weeksInMonth).fill(weekAmount),
    indices,
  };
}

// ==========================================
// PERIOD AGGREGATION FUNCTIONS
// ==========================================

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

// ==========================================
// PERIOD HIERARCHY UTILITIES
// ==========================================

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

// ==========================================
// SCOPE HIERARCHY FUNCTIONS
// ==========================================

/**
 * Get the parent scope type
 */
export function getParentScope(scope: BudgetScope): BudgetScope | null {
  switch (scope) {
    case 'account':
      return 'subcategory'; // Could also be 'category' if no subcategory
    case 'subcategory':
      return 'category';
    case 'category':
      return 'overall';
    case 'overall':
      return null;
    default:
      return null;
  }
}

/**
 * Get the child scope type
 */
export function getChildScope(scope: BudgetScope): BudgetScope | null {
  switch (scope) {
    case 'overall':
      return 'category';
    case 'category':
      return 'subcategory';
    case 'subcategory':
      return 'account';
    case 'account':
      return null;
    default:
      return null;
  }
}

/**
 * Check if two budgets are in the same period
 */
export function isSamePeriod(a: Budget, b: Budget): boolean {
  return a.period === b.period && 
         a.year === b.year && 
         a.periodIndex === b.periodIndex;
}

/**
 * Distribute an overall/parent budget amount to child scopes
 * @param parentAmount The total parent budget
 * @param childCount Number of children to distribute to
 * @param weights Optional weights for each child (default: equal distribution)
 */
export function distributeScopeAmount(
  parentAmount: number,
  childCount: number,
  weights?: number[]
): number[] {
  if (childCount === 0) return [];
  
  if (weights && weights.length === childCount) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => Math.round((parentAmount * w / totalWeight) * 100) / 100);
  }
  
  // Equal distribution
  const amount = Math.round((parentAmount / childCount) * 100) / 100;
  return Array(childCount).fill(amount);
}

/**
 * Aggregate child scope budgets to parent scope total
 */
export function aggregateChildScopeBudgets(childBudgets: Budget[]): number {
  return childBudgets.reduce((sum, b) => sum + b.amount, 0);
}

// ==========================================
// ALLOCATION VALIDATION
// ==========================================

export interface AllocationResult {
  allocated: number;
  unallocated: number;
  isOverAllocated: boolean;
  percentAllocated: number;
}

/**
 * Calculate the allocated amount for a parent budget from its children
 */
export function calculateAllocatedAmount(
  parentBudget: Budget,
  childBudgets: Budget[]
): AllocationResult {
  const allocated = childBudgets.reduce((sum, b) => sum + b.amount, 0);
  const unallocated = parentBudget.amount - allocated;
  const isOverAllocated = allocated > parentBudget.amount;
  const percentAllocated = parentBudget.amount > 0 ? (allocated / parentBudget.amount) * 100 : 0;
  
  return { allocated, unallocated, isOverAllocated, percentAllocated };
}

/**
 * Validate that child scope budgets don't exceed parent scope budget
 */
export function validateScopeAllocation(
  parentBudget: Budget,
  childBudgets: Budget[]
): { isValid: boolean; overage: number; message?: string } {
  const { allocated, isOverAllocated } = calculateAllocatedAmount(parentBudget, childBudgets);
  
  if (isOverAllocated) {
    const overage = allocated - parentBudget.amount;
    return {
      isValid: false,
      overage,
      message: `Child budgets exceed parent by ${overage.toFixed(2)}`
    };
  }
  
  return { isValid: true, overage: 0 };
}

// ==========================================
// AFFECTED BUDGETS FINDER
// ==========================================

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
  parentScopeBudgets: Budget[];
  childScopeBudgets: Budget[];
} {
  const parentBudgets: Budget[] = [];
  const childBudgets: Budget[] = [];
  const siblingBudgets: Budget[] = [];
  
  // Period hierarchy - same scope and target
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
      const parentIndex = getParentPeriodIndex(changedBudget.period, changedBudget.periodIndex || 1);
      if (budget.periodIndex === parentIndex || (budget.period === 'yearly' && parentPeriod === 'yearly')) {
        parentBudgets.push(budget);
      }
    } else if (budget.period === childPeriod) {
      const childParentIndex = getParentPeriodIndex(budget.period, budget.periodIndex || 1);
      if (childParentIndex === changedBudget.periodIndex || changedBudget.period === 'yearly') {
        childBudgets.push(budget);
      }
    } else if (budget.period === changedBudget.period) {
      siblingBudgets.push(budget);
    }
  });
  
  // Scope hierarchy - same period but different scope levels
  const parentScope = getParentScope(changedBudget.scope);
  const childScope = getChildScope(changedBudget.scope);
  
  const parentScopeBudgets = allBudgets.filter(
    b => parentScope && b.scope === parentScope && isSamePeriod(b, changedBudget)
  );
  
  const childScopeBudgets = allBudgets.filter(
    b => childScope && b.scope === childScope && isSamePeriod(b, changedBudget)
  );
  
  return { parentBudgets, childBudgets, siblingBudgets, parentScopeBudgets, childScopeBudgets };
}

/**
 * Find a parent period budget for a given budget configuration
 * Used to show warnings when child budget exceeds parent allocation
 */
export function findParentPeriodBudget(
  budget: Pick<Budget, 'scope' | 'targetId' | 'period' | 'year' | 'periodIndex'>,
  allBudgets: Budget[]
): Budget | null {
  const parentPeriod = getParentPeriod(budget.period);
  if (!parentPeriod) return null;
  
  const parentPeriodIndex = budget.periodIndex 
    ? getParentPeriodIndex(budget.period, budget.periodIndex)
    : undefined;
  
  return allBudgets.find(b => 
    b.scope === budget.scope &&
    b.targetId === budget.targetId &&
    b.period === parentPeriod &&
    b.year === budget.year &&
    (parentPeriod === 'yearly' || b.periodIndex === parentPeriodIndex)
  ) || null;
}

// ==========================================
// UPWARD PROPAGATION FUNCTIONS
// ==========================================

export interface ParentBudgetUpdate {
  id: string;
  period: BudgetPeriod;
  periodIndex?: number;
  currentAmount: number;
  newAmount: number;
  delta: number;
}

export interface PropagationResult {
  quarterUpdate?: ParentBudgetUpdate;
  yearlyUpdate?: ParentBudgetUpdate;
}

/**
 * Calculate what parent budget amounts should be if we aggregate from children
 * Used for upward propagation when updating a child period budget
 */
export function calculateParentPeriodUpdates(
  childBudget: Budget,
  newChildAmount: number,
  allBudgets: Budget[]
): PropagationResult {
  const result: PropagationResult = {};
  
  // Filter to same scope and target
  const matchingBudgets = allBudgets.filter(
    b => b.scope === childBudget.scope && 
         b.targetId === childBudget.targetId &&
         b.year === childBudget.year &&
         b.id !== childBudget.id &&
         b.isActive !== false
  );
  
  if (childBudget.period === 'monthly') {
    // Find quarter and year budgets
    const quarter = Math.ceil((childBudget.periodIndex || 1) / 3);
    const quarterBudget = matchingBudgets.find(
      b => b.period === 'quarterly' && b.periodIndex === quarter
    );
    const yearlyBudget = matchingBudgets.find(
      b => b.period === 'yearly'
    );
    
    // Get sibling months in this quarter
    const quarterMonths = getMonthsInQuarter(quarter);
    const siblingMonths = matchingBudgets.filter(
      b => b.period === 'monthly' && 
           b.periodIndex !== undefined &&
           quarterMonths.includes(b.periodIndex)
    );
    
    // Calculate new quarter total
    const siblingTotal = siblingMonths.reduce((sum, b) => sum + b.amount, 0);
    const newQuarterTotal = siblingTotal + newChildAmount;
    
    if (quarterBudget) {
      result.quarterUpdate = {
        id: quarterBudget.id,
        period: 'quarterly',
        periodIndex: quarter,
        currentAmount: quarterBudget.amount,
        newAmount: newQuarterTotal,
        delta: newQuarterTotal - quarterBudget.amount,
      };
    }
    
    // Calculate new yearly total
    if (yearlyBudget) {
      // Get all quarter totals
      const allQuarterBudgets = matchingBudgets.filter(b => b.period === 'quarterly');
      const otherQuartersTotal = allQuarterBudgets
        .filter(b => b.periodIndex !== quarter)
        .reduce((sum, b) => sum + b.amount, 0);
      
      const newYearlyTotal = otherQuartersTotal + newQuarterTotal;
      
      result.yearlyUpdate = {
        id: yearlyBudget.id,
        period: 'yearly',
        currentAmount: yearlyBudget.amount,
        newAmount: newYearlyTotal,
        delta: newYearlyTotal - yearlyBudget.amount,
      };
    }
  } else if (childBudget.period === 'quarterly') {
    // Find yearly budget
    const yearlyBudget = matchingBudgets.find(b => b.period === 'yearly');
    
    if (yearlyBudget) {
      // Get sibling quarters
      const siblingQuarters = matchingBudgets.filter(
        b => b.period === 'quarterly' && b.periodIndex !== childBudget.periodIndex
      );
      const siblingTotal = siblingQuarters.reduce((sum, b) => sum + b.amount, 0);
      const newYearlyTotal = siblingTotal + newChildAmount;
      
      result.yearlyUpdate = {
        id: yearlyBudget.id,
        period: 'yearly',
        currentAmount: yearlyBudget.amount,
        newAmount: newYearlyTotal,
        delta: newYearlyTotal - yearlyBudget.amount,
      };
    }
  } else if (childBudget.period === 'weekly') {
    // Find monthly budget - weeks are more complex due to variable weeks per month
    // For simplicity, we aggregate weekly to monthly only
    const monthBudget = matchingBudgets.find(
      b => b.period === 'monthly' && b.periodIndex === childBudget.periodIndex
    );
    
    if (monthBudget) {
      const siblingWeeks = matchingBudgets.filter(
        b => b.period === 'weekly' && b.periodIndex !== childBudget.periodIndex
      );
      const siblingTotal = siblingWeeks.reduce((sum, b) => sum + b.amount, 0);
      
      result.quarterUpdate = {
        id: monthBudget.id,
        period: 'monthly',
        periodIndex: monthBudget.periodIndex,
        currentAmount: monthBudget.amount,
        newAmount: siblingTotal + newChildAmount,
        delta: (siblingTotal + newChildAmount) - monthBudget.amount,
      };
    }
  }
  
  return result;
}

/**
 * Get sibling budgets for a given budget (same period type, same scope/target)
 */
export function getSiblingBudgets(
  budget: Budget,
  allBudgets: Budget[]
): Budget[] {
  // For monthly budgets, get siblings in the same quarter
  // For quarterly budgets, get siblings in the same year
  // For weekly budgets, get siblings in the same month
  
  return allBudgets.filter(b => {
    if (b.id === budget.id) return false;
    if (b.scope !== budget.scope) return false;
    if (b.targetId !== budget.targetId) return false;
    if (b.year !== budget.year) return false;
    if (b.period !== budget.period) return false;
    if (b.isActive === false) return false;
    
    // Check if in same parent period
    if (budget.period === 'monthly') {
      const myQuarter = Math.ceil((budget.periodIndex || 1) / 3);
      const sibQuarter = Math.ceil((b.periodIndex || 1) / 3);
      return myQuarter === sibQuarter;
    }
    
    // Quarterly and yearly are siblings by default (same year)
    return true;
  });
}

/**
 * Get parent period budget for a given child budget
 */
export function getParentBudget(
  budget: Budget,
  allBudgets: Budget[]
): Budget | null {
  const parentPeriod = getParentPeriod(budget.period);
  if (!parentPeriod) return null;
  
  const parentPeriodIndex = budget.periodIndex 
    ? getParentPeriodIndex(budget.period, budget.periodIndex)
    : undefined;
  
  return allBudgets.find(b => 
    b.scope === budget.scope &&
    b.targetId === budget.targetId &&
    b.period === parentPeriod &&
    b.year === budget.year &&
    b.isActive !== false &&
    (parentPeriod === 'yearly' || b.periodIndex === parentPeriodIndex)
  ) || null;
}

/**
 * Calculate the current aggregated total from child period budgets
 */
export function getAggregatedChildTotal(
  parentBudget: Budget,
  allBudgets: Budget[]
): { total: number; childCount: number; children: Budget[] } {
  const childPeriod = getChildPeriod(parentBudget.period);
  if (!childPeriod) return { total: 0, childCount: 0, children: [] };
  
  const childIndices = getChildPeriodIndices(
    parentBudget.period, 
    parentBudget.periodIndex, 
    parentBudget.year
  );
  
  const children = allBudgets.filter(b => 
    b.scope === parentBudget.scope &&
    b.targetId === parentBudget.targetId &&
    b.period === childPeriod &&
    b.year === parentBudget.year &&
    b.isActive !== false &&
    (b.periodIndex !== undefined && childIndices.includes(b.periodIndex))
  );
  
  const total = children.reduce((sum, b) => sum + b.amount, 0);
  
  return { total, childCount: children.length, children };
}

export const budgetHierarchyService = {
  // Period distribution
  distributeYearlyToQuarters,
  distributeQuarterlyToMonths,
  distributeMonthlyToWeeks,
  
  // Period aggregation
  aggregateWeeksToMonth,
  aggregateMonthsToQuarter,
  aggregateQuartersToYear,
  
  // Period hierarchy
  getParentPeriod,
  getChildPeriod,
  getParentPeriodIndex,
  getChildPeriodIndices,
  calculateDerivedBudgetAmount,
  
  // Scope hierarchy
  getParentScope,
  getChildScope,
  isSamePeriod,
  distributeScopeAmount,
  aggregateChildScopeBudgets,
  
  // Validation
  calculateAllocatedAmount,
  validateScopeAllocation,
  
  // Affected budgets
  findAffectedBudgets,
  
  // Upward propagation
  calculateParentPeriodUpdates,
  getSiblingBudgets,
  getParentBudget,
  getAggregatedChildTotal,
};
