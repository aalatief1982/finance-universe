import { describe, expect, it, vi } from 'vitest';
import {
  isValidAmount,
  isValidCategory,
  isValidDate,
  isValidSubcategory,
  isValidType,
  validateTransactionInput,
} from '../transaction-validator';

const toastMock = vi.fn();

vi.mock('@/components/ui/use-toast', () => ({
  toast: toastMock,
}));

vi.mock('@/lib/categories-data', () => ({
  getCategoriesForType: vi.fn(() => ['Food']),
  getSubcategoriesForCategory: vi.fn((category: string) =>
    category === 'Food' ? ['Dining'] : []
  ),
}));

describe('transaction-validator', () => {
  it('validates amounts, dates, and types', () => {
    expect(isValidAmount(10)).toBe(true);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidDate('2999-01-01')).toBe(false);
    expect(isValidType('income')).toBe(true);
    expect(isValidType('invalid')).toBe(false);
  });

  it('validates categories and subcategories', () => {
    expect(isValidCategory('expense', 'Food')).toBe(true);
    expect(isValidCategory('expense', 'Unknown')).toBe(false);
    expect(isValidSubcategory('Food', 'Dining')).toBe(true);
    expect(isValidSubcategory('Food', 'Other')).toBe(false);
  });

  it('returns false and calls toast for invalid transactions', () => {
    const invalidTxn = {
      id: 't1',
      title: 'Test',
      amount: 25,
      category: 'Food',
      subcategory: 'Invalid',
      date: '2024-01-01',
      type: 'expense',
      source: 'manual',
      fromAccount: 'Cash',
    } as any;

    const result = validateTransactionInput(invalidTxn);
    expect(result).toBe(false);
    expect(toastMock).toHaveBeenCalled();
  });
});
