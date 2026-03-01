import { describe, expect, it, beforeEach } from 'vitest';
import { Transaction } from '@/types/transaction';
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
      rawMessage: '',
      template: '',
      templateHash: '',
      matched: false,
      directFields: { amount: { value: '100', confidenceScore: 1, source: 'direct' as const }, currency: { value: 'SAR', confidenceScore: 1, source: 'direct' as const } },
      inferredFields: { category: { value: 'Food', confidenceScore: 0.5, source: 'inferred' as const } },
      defaultValues: { type: { value: 'expense', confidenceScore: 0.3, source: 'default' as const } },
      candidates: { accountCandidates: [] as string[] },
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
      id: '1', title: '', amount: 0, date: '', type: 'expense' as const,
      category: 'Food', source: 'smart-paste' as const, createdAt: '',
      vendor: 'Acme Store',
      fromAccount: 'Main Checking',
    };
    expect(getKeywordConfidence(transaction as Transaction, keywordBank)).toBeCloseTo(0.825, 3);
  });

  it('returns zero keyword confidence when no sources match', () => {
    const transaction = {
      id: '1', title: '', amount: 0, date: '', type: 'expense' as const,
      category: '', source: 'smart-paste' as const, createdAt: '',
      currency: 'SAR',
      vendor: 'Unknown',
    };
    expect(getKeywordConfidence(transaction as Transaction, [])).toBe(0);
  });

  it('returns full template confidence when template matched', () => {
    expect(getTemplateConfidence(1, 3)).toBe(1);
  });

  it('computes weighted overall confidence', () => {
    expect(computeOverallConfidence(1, 0.5, 0.25)).toBeCloseTo(0.5 * 1 + 0.3 * 0.5 + 0.2 * 0.25, 5);
  });
});
