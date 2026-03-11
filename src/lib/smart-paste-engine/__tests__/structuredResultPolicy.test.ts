import { describe, expect, it } from 'vitest';
import type { ParsedTransactionResult } from '../parseAndInferTransaction';
import { shouldKeepStructuredResult } from '../structuredResultPolicy';

const makeResult = (overrides: Partial<ParsedTransactionResult>): ParsedTransactionResult => ({
  transaction: {
    id: '1',
    amount: 0,
    currency: 'SAR',
    date: '',
    type: 'expense',
    category: 'Uncategorized',
    subcategory: 'none',
    vendor: '',
    source: 'smart-paste',
    createdAt: new Date().toISOString(),
    title: '',
  },
  confidence: 0.3,
  origin: 'structure',
  parsed: {
    rawMessage: 'msg',
    template: 't',
    templateHash: 'h',
    matched: false,
    directFields: {},
    inferredFields: {},
    defaultValues: {},
    candidates: { accountCandidates: [] },
  },
  fieldConfidences: {},
  parsingStatus: 'partial',
  matchedCount: 0,
  totalTemplates: 0,
  fieldScore: 0,
  keywordScore: 0,
  debugTrace: {
    confidenceBreakdown: { fieldScore: 0, templateScore: 0, keywordScore: 0, overallConfidence: 0.3 },
    templateSelection: { selected: 'structure', reason: '', candidates: [] },
    fields: [],
  },
  ...overrides,
});

describe('shouldKeepStructuredResult', () => {
  it('keeps legacy strong structured outcomes', () => {
    expect(shouldKeepStructuredResult(makeResult({ confidence: 0.55 }))).toBe(true);
    expect(shouldKeepStructuredResult(makeResult({ parsed: { ...makeResult({}).parsed, matched: true } }))).toBe(true);
  });

  it('keeps semi-structured partial when amount+currency+vendor exist', () => {
    const result = makeResult({
      confidence: 0.44,
      parsingStatus: 'partial',
      parsed: {
        ...makeResult({}).parsed,
        directFields: {
          amount: { value: '38.38', confidenceScore: 1, source: 'direct' },
          currency: { value: 'SAR', confidenceScore: 1, source: 'direct' },
        },
        inferredFields: {
          vendor: { value: 'GITHUB, INC', confidenceScore: 0.3, source: 'inferred' },
        },
      },
    });

    expect(shouldKeepStructuredResult(result)).toBe(true);
  });

  it('does not keep weak structured result without core fields', () => {
    const result = makeResult({ confidence: 0.42, parsingStatus: 'partial' });
    expect(shouldKeepStructuredResult(result)).toBe(false);
  });
});
