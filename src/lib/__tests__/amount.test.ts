import { describe, expect, it } from 'vitest';
import { parseAmount } from '@/lib/amount';
import { validateTransactionForm } from '@/lib/transaction-validation';

describe('parseAmount', () => {
  it('parses formatted numeric strings', () => {
    expect(parseAmount(' 1,250.50 ')).toBe(1250.5);
  });

  it('returns NaN for empty values', () => {
    expect(Number.isNaN(parseAmount(''))).toBe(true);
  });

  it('strips currency suffixes and still parses', () => {
    expect(parseAmount('500 SAR')).toBe(500);
  });
});

describe('transaction amount validation', () => {
  it('accepts positive amount strings', () => {
    const errors = validateTransactionForm({
      title: 'Lunch',
      amount: 500,
      type: 'expense',
      fromAccount: 'Cash',
      category: 'Food',
      subcategory: 'Restaurant',
      date: '2026-01-01',
      currency: 'SAR',
    });

    expect(errors.amount).toBeUndefined();
  });

  it('accepts signed expense amounts used by persisted transactions', () => {
    const errors = validateTransactionForm({
      title: 'Groceries',
      amount: -800,
      type: 'expense',
      fromAccount: 'Cash',
      category: 'Food',
      subcategory: 'Restaurant',
      date: '2026-01-01',
      currency: 'SAR',
    });

    expect(errors.amount).toBeUndefined();
  });

  it('still rejects empty/zero amounts', () => {
    const emptyErrors = validateTransactionForm({
      title: 'Groceries',
      type: 'expense',
      fromAccount: 'Cash',
      category: 'Food',
      subcategory: 'Restaurant',
      date: '2026-01-01',
      currency: 'SAR',
    });
    const zeroErrors = validateTransactionForm({
      title: 'Groceries',
      amount: 0,
      type: 'expense',
      fromAccount: 'Cash',
      category: 'Food',
      subcategory: 'Restaurant',
      date: '2026-01-01',
      currency: 'SAR',
    });

    expect(emptyErrors.amount).toBe('Amount is required');
    expect(zeroErrors.amount).toBe('Amount must be greater than 0');
  });
});
