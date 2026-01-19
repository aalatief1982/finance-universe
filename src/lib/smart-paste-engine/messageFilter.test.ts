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

  it('falls back to default keywords when stored keywords are malformed', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify({ expense: ['purchase'] }));
    const message = 'تم تحويل SAR 250 في 2024-01-02';
    expect(isFinancialTransactionMessage(message)).toBe(true);
  });

  it('returns false when amount is missing even if keyword and date exist', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(['deposit']));
    const message = 'Deposit completed on 2024-02-01';
    expect(isFinancialTransactionMessage(message)).toBe(false);
  });
});
