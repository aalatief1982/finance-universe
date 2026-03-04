import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeStorage } from '@/utils/safe-storage';
import {
  applyFieldPromotionOverlay,
  loadPromotionStats,
  recordFieldPromotionLearning,
} from '../fieldPromotionOverlay';

const STORE_KEY = 'xpensia_field_promotion_stats';

describe('fieldPromotionOverlay', () => {
  beforeEach(() => {
    safeStorage.removeItem(STORE_KEY);
    vi.unstubAllEnvs();
  });

  it('promotes category/subcategory to detected after 3 confirmations', () => {
    for (let i = 0; i < 3; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-1',
        vendor: 'Amazon',
        predicted: { category: 'Shopping', subcategory: 'Online' },
        confirmed: { category: 'Shopping', subcategory: 'Online' },
      });
    }

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-1',
      vendor: 'Amazon',
      fields: {
        category: { value: 'Shopping', score: 0.7, source: 'inferred' },
        subcategory: { value: 'Online', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.category).toBe(0.85);
    expect(result.promotedScores.subcategory).toBe(0.85);
    expect(result.promotedFields.category).toBe('promoted');
    expect(result.promotedFields.subcategory).toBe('promoted');
  });

  it('demotes after contradiction', () => {
    for (let i = 0; i < 3; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-2',
        vendor: 'Noon',
        predicted: { category: 'Shopping' },
        confirmed: { category: 'Shopping' },
      });
    }

    recordFieldPromotionLearning({
      senderHint: 'BANK',
      templateHash: 'hash-2',
      vendor: 'Noon',
      predicted: { category: 'Shopping' },
      confirmed: { category: 'Bills' },
    });

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-2',
      vendor: 'Noon',
      fields: {
        category: { value: 'Bills', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.category).toBeUndefined();
  });

  it('keeps fromAccount promotion disabled by default', () => {
    for (let i = 0; i < 8; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-3',
        vendor: 'Uber',
        predicted: { fromAccount: 'Cash' },
        confirmed: { fromAccount: 'Cash' },
        fromAccountDeterministic: true,
      });
    }

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-3',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fields: {
        fromAccount: { value: 'Cash', score: 0.3, source: 'default' },
      },
    });

    expect(result.promotedScores.fromAccount).toBeUndefined();
  });

  it('does not change confidence when stats are missing', () => {
    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-missing',
      vendor: 'Random',
      fields: {
        category: { value: 'Food', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.category).toBeUndefined();
    expect(loadPromotionStats()).toEqual({});
  });
});
