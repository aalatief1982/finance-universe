import { describe, expect, it } from 'vitest';
import {
  determineAmount,
  determineCurrency,
  determineTransaction,
  determineType,
  suggestTransactionDetails,
} from '../LearningEngineService';

describe('LearningEngineService', () => {
  it('determines transaction type from keyword tokens', () => {
    expect(determineType({ received: 'keyword' })).toBe('income');
    expect(determineType({ paid: 'keyword' })).toBe('expense');
  });

  it('extracts amount and currency from tokens', () => {
    expect(determineAmount({ '1,234': 'amount' })).toBe(1234);
    expect(determineCurrency({ SAR: 'currency' })).toBe('SAR');
  });

  it('builds a transaction with defaults', () => {
    const result = determineTransaction({ '12': 'amount', USD: 'currency', Amazon: 'vendor' });
    expect(result.amount).toBe(12);
    expect(result.currency).toBe('USD');
    expect(result.type).toBe('expense');
    expect(result.title).toBe('Amazon');
    expect(result.fromAccount).toBe('Cash');
  });

  it('suggests transaction details from raw message', () => {
    const result = suggestTransactionDetails('Paid 50 USD');
    expect(result.amount).toBe(50);
    expect(result.currency).toBe('USD');
    expect(result.type).toBe('expense');
  });
});
