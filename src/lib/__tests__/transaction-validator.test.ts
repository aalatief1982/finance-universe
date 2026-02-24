import { describe, expect, it, vi } from 'vitest';
import type { Transaction } from '@/types/transaction';
import type { TransactionFormValues } from '@/components/forms/transaction-form-schema';
import {
  isValidAmount,
  isValidCategory,
  isValidDate,
  isValidSubcategory,
  isValidType,
  validateTransactionInput,
} from '../transaction-validator';

// Use vi.hoisted to avoid "Cannot access before initialization" error
const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/components/ui/use-toast', () => ({
  toast: toastMock,
}));

vi.mock('@/lib/categories-data', () => ({
  getCategoriesForType: vi.fn(() => ['Food']),
  getSubcategoriesForCategory: vi.fn((category: string) =>
    category === 'Food' ? ['Dining'] : [],
  ),
}));

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  title: 'Test',
  amount: 25,
  category: 'Food',
  subcategory: 'Dining',
  date: '2024-01-01',
  type: 'expense',
  source: 'manual',
  fromAccount: 'Cash',
  currency: 'SAR',
  ...overrides,
});

const buildFormValues = (overrides: Partial<TransactionFormValues> = {}): TransactionFormValues => ({
  title: 'Lunch',
  amount: 25,
  type: 'expense',
  fromAccount: 'Cash',
  toAccount: '',
  category: 'Food',
  subcategory: 'Dining',
  date: '2024-01-01',
  description: '',
  notes: '',
  currency: 'SAR',
  ...overrides,
});

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

  it('returns typed failure result and calls toast for invalid transactions', () => {
    const invalidTxn = buildTransaction({ subcategory: 'Invalid' });

    const result = validateTransactionInput(invalidTxn);
    expect(result.valid).toBe(false);
    expect(toastMock).toHaveBeenCalled();
  });

  it('accepts form-like payloads at unknown boundary and keeps typed output', () => {
    const formValues = buildFormValues();

    const result = validateTransactionInput(formValues as unknown);
    expect(result.valid).toBe(true);

    if (result.valid) {
      expect(result.transaction.type).toBe('expense');
      expect(result.transaction.category).toBe('Food');
    }
  });
});
