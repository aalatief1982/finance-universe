import { describe, expect, it } from 'vitest';
import { transactionSchema, validateData, validateNewTransaction } from '../validation';

describe('validation schemas', () => {
  it('fails schema validation for invalid dates', () => {
    const result = validateData(transactionSchema, {
      id: 'f2b0f273-3a2c-4dd8-9a1f-9f0f3452e159',
      title: 'Test',
      amount: 12,
      category: 'Food',
      date: 'invalid-date',
      type: 'expense',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid date format');
    }
  });

  it('requires toAccount for transfer transactions', () => {
    const result = validateNewTransaction({
      title: 'Transfer',
      amount: 50,
      category: 'Transfer',
      date: '2024-01-01',
      type: 'transfer',
    });

    expect(result.success).toBe(false);
  });
});
