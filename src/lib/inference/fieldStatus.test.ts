import { describe, expect, it } from 'vitest';
import { computeCapturedFields } from './fieldStatus';

describe('computeCapturedFields', () => {
  it('counts required smart-entry fields using confidence evidence', () => {
    const result = computeCapturedFields(
      {
        amount: 45,
        date: '2026-02-14',
        currency: 'USD',
        type: 'expense',
      },
      {
        amount: 0.9,
        date: 0.7,
        currency: 0.5,
        type: 0.3,
      },
    );

    expect(result.capturedCount).toBe(4);
    expect(result.totalCount).toBe(4);
  });

  it('uses inference metadata when confidences are missing', () => {
    const result = computeCapturedFields(
      {
        amount: 45,
        date: '2026-02-14',
        currency: 'USD',
        type: 'expense',
      },
      {},
      {
        isSuggested: true,
        matchOrigin: 'structure',
      },
    );

    expect(result.capturedCount).toBe(4);
  });
});
