import { describe, expect, it, beforeEach } from 'vitest';
import {
  computeOverallConfidence,
  getFieldConfidence,
  getKeywordConfidence,
  getTemplateConfidence,
} from './confidenceScoring';

describe('confidence scoring', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates field confidence based on available fields', () => {
    const parsed = {
      directFields: { amount: 100, currency: 'SAR' },
      inferredFields: { category: 'Food' },
      defaultValues: { type: 'expense' },
    };
    expect(getFieldConfidence(parsed)).toBe(4 / 8);
  });

  it('returns zero template confidence when no templates exist', () => {
    expect(getTemplateConfidence(1, 0)).toBe(0);
  });

  it('scores keyword confidence using keyword bank and user mappings', () => {
    localStorage.setItem('xpensia_vendor_map', JSON.stringify({ acme: 'Acme Store' }));
    localStorage.setItem('xpensia_fromaccount_map', JSON.stringify({ bank: 'Main Checking' }));

    const keywordBank = [
      {
        keyword: 'acme',
        mappings: [{ field: 'category', value: 'Food' }],
      },
    ];

    const transaction = {
      vendor: 'Acme Store',
      category: 'Food',
      fromAccount: 'Main Checking',
    };

    expect(getKeywordConfidence(transaction, keywordBank)).toBeCloseTo(0.825, 3);
  });

  it('returns zero keyword confidence when no sources match', () => {
    const transaction = { vendor: 'Unknown' };
    expect(getKeywordConfidence(transaction, [])).toBe(0);
  });

  it('returns full template confidence when template matched', () => {
    expect(getTemplateConfidence(1, 3)).toBe(1);
  });

  it('computes weighted overall confidence', () => {
    expect(computeOverallConfidence(1, 0.5, 0.25)).toBeCloseTo(0.5 * 1 + 0.3 * 0.5 + 0.2 * 0.25, 5);
  });
});
