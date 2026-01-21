import { describe, expect, it, vi } from 'vitest';
import { parseAndInferTransaction } from '../parseAndInferTransaction';

vi.mock('nanoid', () => ({ nanoid: () => 'test-id' }));

vi.mock('../structureParser', () => ({
  parseSmsMessage: vi.fn(() => ({
    rawMessage: 'raw',
    template: 'tmpl',
    templateHash: 'hash',
    matched: true,
    directFields: {
      amount: { value: '100', confidenceScore: 1, source: 'direct' },
      currency: { value: 'SAR', confidenceScore: 1, source: 'direct' },
      date: { value: '2024-05-01', confidenceScore: 1, source: 'direct' },
      fromAccount: { value: 'Bank', confidenceScore: 1, source: 'direct' },
      vendor: { value: 'Shop', confidenceScore: 1, source: 'direct' }
    },
    inferredFields: {
      type: { value: 'expense', confidenceScore: 0.7, source: 'inferred' },
      category: { value: 'Food', confidenceScore: 0.7, source: 'inferred' },
      subcategory: { value: 'Groceries', confidenceScore: 0.7, source: 'inferred' },
      vendor: { value: 'Shop', confidenceScore: 0.7, source: 'inferred' }
    },
    defaultValues: {}
  }))
}));

vi.mock('../keywordBankUtils', () => ({ loadKeywordBank: () => [] }));
vi.mock('../templateUtils', () => ({ getAllTemplates: () => [] }));
vi.mock('../cloudClassifier', () => ({ classifySmsViaCloud: vi.fn() }));
vi.mock('../confidenceScoring', () => ({
  getFieldConfidence: () => 1,
  getTemplateConfidence: () => 1,
  getKeywordConfidence: () => 0,
  computeOverallConfidence: () => 0.8
}));

describe('parseAndInferTransaction', () => {
  it('creates transaction with template origin', async () => {
    const { transaction, confidence, origin, parsed } = await parseAndInferTransaction('message');
    expect(transaction.amount).toBe(100);
    expect(transaction.currency).toBe('SAR');
    expect(transaction.vendor).toBe('Shop');
    expect(transaction.fromAccount).toBe('Bank');
    expect(confidence).toBe(0.8);
    expect(origin).toBe('template');
    expect(parsed.template).toBe('tmpl');
  });
});
