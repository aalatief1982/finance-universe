import { describe, expect, it, beforeEach } from 'vitest';
import {
  extractVendorName,
  findClosestFallbackMatch,
  getKeywordMatches,
  inferIndirectFields,
} from '../suggestionEngine';

const vendorFallbacks = {
  'acme store': {
    type: 'expense',
    category: 'Shopping',
    subcategory: 'Retail',
  },
};

describe('suggestionEngine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('extracts vendor names from messages', () => {
    expect(extractVendorName('Paid to Starbucks on 2024-01-02')).toBe('Starbucks');
  });

  it('falls back to Company for salary messages', () => {
    expect(extractVendorName('Salary credited to account')).toBe('Company');
  });

  it('ignores ambiguous numeric vendor candidates', () => {
    expect(extractVendorName('Paid to 1234 on 2024-01-02')).toBe('');
  });

  it('finds closest fallback vendor matches', () => {
    localStorage.setItem('xpensia_vendor_fallbacks', JSON.stringify(vendorFallbacks));
    const match = findClosestFallbackMatch('Acme Store Riyadh');
    expect(match?.category).toBe('Shopping');
  });

  it('infers fields from keyword bank and type keywords', () => {
    localStorage.setItem(
      'xpensia_keyword_bank',
      JSON.stringify([
        {
          keyword: 'amazon',
          mappings: [{ field: 'category', value: 'Shopping' }],
        },
      ])
    );
    localStorage.setItem(
      'xpensia_type_keywords',
      JSON.stringify({ expense: ['paid'] })
    );

    const inferred = inferIndirectFields('Paid Amazon SAR 50');
    expect(inferred.category).toBe('Shopping');
    expect(inferred.type).toBe('expense');
  });

  it('uses vendor fallback when category is missing', () => {
    localStorage.setItem('xpensia_vendor_fallbacks', JSON.stringify(vendorFallbacks));
    const inferred = inferIndirectFields('Payment at Acme Store');
    expect(inferred.category).toBe('Shopping');
    expect(inferred.subcategory).toBe('Retail');
  });

  it('returns keyword matches ordered by mapping count', () => {
    localStorage.setItem(
      'xpensia_keyword_bank',
      JSON.stringify([
        { keyword: 'market', type: 'auto', mappingCount: 1 },
        { keyword: 'marketplace', type: 'auto', mappingCount: 3 },
      ])
    );

    const matches = getKeywordMatches('market');
    expect(matches[0].keyword).toBe('marketplace');
    expect(matches[1].keyword).toBe('market');
  });
});
