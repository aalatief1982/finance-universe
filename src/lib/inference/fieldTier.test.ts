import { describe, expect, it } from 'vitest';
import { resolveFieldTier } from './fieldTier';

describe('resolveFieldTier', () => {
  it('maps explicit field confidences to high/medium/low tiers', () => {
    expect(
      resolveFieldTier('amount', {
        transaction: { amount: 12 },
        fieldConfidences: { amount: 0.92 },
      }).tier,
    ).toBe('high');

    expect(
      resolveFieldTier('vendor', {
        transaction: { vendor: 'Store' },
        fieldConfidences: { vendor: 0.6 },
      }).tier,
    ).toBe('medium');

    expect(
      resolveFieldTier('category', {
        transaction: { category: 'Food' },
        fieldConfidences: { category: 0.2 },
      }).tier,
    ).toBe('low');
  });

  it('falls back to origin heuristics when field scores are missing', () => {
    expect(
      resolveFieldTier('amount', {
        transaction: { amount: 12 },
        matchOrigin: 'template',
      }).tier,
    ).toBe('medium');

    expect(
      resolveFieldTier('vendor', {
        transaction: { vendor: 'Store' },
        matchOrigin: 'template',
      }).tier,
    ).toBe('medium');

    expect(
      resolveFieldTier('vendor', {
        transaction: { vendor: 'Store' },
        matchOrigin: 'structure',
      }).tier,
    ).toBe('low');
  });
});
