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


  it('extracts Arabic labeled merchant and avoids matching inside فيزا', () => {
    const message = `شراء إنترنت
بطاقة:5766 ;فيزا
مبلغ:35 SAR
لدى:bolt.eu
رصيد:4212.31 SAR
26/2/26 16:40`;
    expect(extractVendorName(message)).toBe('bolt.eu');
  });

  it('extracts Arabic anchor merchant before amount delimiters', () => {
    const message = '... لدى Google YouTubePremium بمبلغ SAR 49.99 في UNITED STATES ...';
    expect(extractVendorName(message)).toBe('Google YouTubePremium');
  });

  it('rejects malformed vendor captures that include currency fragments', () => {
    expect(extractVendorName('Paid to Google YouTubePremium SAR 49.99')).toBe('');
  });

  it('prefers longer vendor fallback keyword for substring matches', () => {
    localStorage.setItem(
      'xpensia_vendor_fallbacks',
      JSON.stringify({
        acme: { type: 'expense', category: 'Shopping', subcategory: 'Generic' },
        'acme store': { type: 'expense', category: 'Shopping', subcategory: 'Retail' },
      })
    );

    const match = findClosestFallbackMatch('Acme Store Riyadh');
    expect(match?.vendor).toBe('acme store');
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

  it('prefers longer category keyword when multiple keywords match', () => {
    localStorage.setItem(
      'xpensia_keyword_bank',
      JSON.stringify([
        {
          keyword: 'uber',
          mappings: [{ field: 'category', value: 'Transportation' }],
        },
        {
          keyword: 'uber eats',
          mappings: [{ field: 'category', value: 'Food & Dining' }],
        },
      ])
    );

    const inferred = inferIndirectFields('Paid to Uber Eats today');
    expect(inferred.category).toBe('Food & Dining');
  });

  it('prefers exact type keyword over substring keyword', () => {
    localStorage.setItem(
      'xpensia_type_keywords',
      JSON.stringify({
        income: ['credit'],
        expense: ['credited'],
      })
    );

    const inferred = inferIndirectFields('credit alert for account');
    expect(inferred.type).toBe('income');
  });

  it('prefers newer keyword metadata when keyword quality ties', () => {
    localStorage.setItem(
      'xpensia_keyword_bank',
      JSON.stringify([
        {
          keyword: 'netflix',
          mappings: [{ field: 'subcategory', value: 'Video' }],
          lastUpdated: '2024-01-01T00:00:00.000Z',
        },
        {
          keyword: 'netflix',
          mappings: [{ field: 'subcategory', value: 'Streaming' }],
          lastUpdated: '2025-01-01T00:00:00.000Z',
        },
      ])
    );

    const inferred = inferIndirectFields('Payment to Netflix');
    expect(inferred.subcategory).toBe('Streaming');
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
