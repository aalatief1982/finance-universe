import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateDerivedBudgetAmount,
  distributeYearlyToQuarters,
  distributeScopeAmount,
  getParentPeriod,
  getChildScope,
  validateScopeAllocation,
} from '../BudgetHierarchyService';
import type { Budget } from '@/models/budget';

const baseBudget: Budget = {
  id: 'b1',
  scope: 'category',
  targetId: 'food',
  amount: 1200,
  currency: 'USD',
  period: 'yearly',
  year: 2024,
  isOverride: true,
};

describe('BudgetHierarchyService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('distributes yearly budgets across quarters', () => {
    const result = distributeYearlyToQuarters(1200);
    expect(result.amounts).toEqual([300, 300, 300, 300]);
    expect(result.indices).toEqual([1, 2, 3, 4]);
  });

  it('calculates derived amounts for child periods', () => {
    const monthlyAmount = calculateDerivedBudgetAmount(baseBudget, 'monthly', 1, 2024);
    expect(monthlyAmount).toBeCloseTo(100);
  });

  it('returns parent and child scope types', () => {
    expect(getParentPeriod('monthly')).toBe('quarterly');
    expect(getChildScope('category')).toBe('subcategory');
  });

  it('distributes scope amounts evenly when no weights provided', () => {
    expect(distributeScopeAmount(100, 2)).toEqual([50, 50]);
  });

  it('validates scope allocation totals', () => {
    const parent = { ...baseBudget, amount: 500 };
    const childBudgets: Budget[] = [
      { ...baseBudget, id: 'c1', amount: 300, period: 'monthly', periodIndex: 1 },
      { ...baseBudget, id: 'c2', amount: 250, period: 'monthly', periodIndex: 2 },
    ];

    const result = validateScopeAllocation(parent, childBudgets);
    expect(result.isValid).toBe(false);
    expect(result.overage).toBe(50);
  });
});
