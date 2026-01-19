import { describe, expect, it, beforeEach } from 'vitest';
import { isFinancialTransactionMessage } from './messageFilter';

const baseMessage = 'Deposit of SAR 1,234 on 2024-02-01';

describe('isFinancialTransactionMessage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns true when keyword, amount, and date are present', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(['deposit']));
    expect(isFinancialTransactionMessage(baseMessage)).toBe(true);
  });

  it('returns false when the date is missing', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(['deposit']));
    expect(isFinancialTransactionMessage('Deposit of SAR 1,234 yesterday')).toBe(false);
  });
});
