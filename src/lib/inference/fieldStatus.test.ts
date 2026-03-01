import { describe, expect, it } from 'vitest';
import { computeCapturedFields } from './fieldStatus';

describe('computeCapturedFields', () => {
  it('counts only high-confidence core smart-entry fields', () => {
    const result = computeCapturedFields(
      {
        amount: 45,
        date: '2026-02-14',
        vendor: 'ACME',
        category: 'Food',
      },
      {
        amount: 0.95,
        date: 0.85,
        vendor: 0.62,
        category: 0.2,
      },
    );

    expect(result.capturedCount).toBe(2);
    expect(result.totalCount).toBe(4);
    expect(result.capturedFields).toEqual(['amount', 'date']);
  });

  it('uses origin fallback tiers when confidences are missing', () => {
    const result = computeCapturedFields(
      {
        amount: 45,
        date: '2026-02-14',
        vendor: 'ACME',
        category: 'Food',
      },
      {},
      {
        isSuggested: true,
        matchOrigin: 'template',
      },
    );

    expect(result.capturedCount).toBe(0);
    expect(result.totalCount).toBe(4);
  });
});
