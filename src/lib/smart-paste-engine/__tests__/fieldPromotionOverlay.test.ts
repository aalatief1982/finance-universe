import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeStorage } from '@/utils/safe-storage';
import {
  applyFieldPromotionOverlay,
  loadPromotionStats,
  recordFieldPromotionLearning,
} from '../fieldPromotionOverlay';

const STORE_KEY = 'xpensia_field_promotion_stats';
const RELIABILITY_KEY = 'xpensia_field_reliability_stats';

describe('fieldPromotionOverlay', () => {
  beforeEach(() => {
    safeStorage.removeItem(STORE_KEY);
    safeStorage.removeItem(RELIABILITY_KEY);
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

  it('promotes type by deterministic POS markers when flag is enabled', () => {
    vi.stubEnv('VITE_PROMOTE_TYPE_CONFIDENCE', 'true');

    const result = applyFieldPromotionOverlay({
      rawMessage: 'شراء عبر نقاط البيع باستخدام mada',
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.type).toBe(0.85);
    expect(result.promotedFields.type).toBe('promoted');
    expect(result.evidence[0]?.sourceKind).toBe('promoted_by_rule');
  });

  it('does not promote type when contradiction markers exist', () => {
    vi.stubEnv('VITE_PROMOTE_TYPE_CONFIDENCE', 'true');

    const result = applyFieldPromotionOverlay({
      rawMessage: 'شراء عبر نقاط البيع ثم استرجاع العملية',
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.type).toBeUndefined();
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

  it('promotes fromAccount to warming and detected with reliable deterministic history', () => {
    vi.stubEnv('VITE_PROMOTE_FROM_ACCOUNT_CONFIDENCE', 'true');

    for (let i = 0; i < 3; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-acc',
        vendor: 'Uber',
        predicted: { fromAccount: 'SAB' },
        confirmed: { fromAccount: 'SAB' },
        fromAccountDeterministic: true,
      });
    }

    const warming = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-acc',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['****7413'],
    });

    expect(warming.promotedScores.fromAccount).toBe(0.6);
    expect(warming.promotedFields.fromAccount).toBe('warming');

    for (let i = 0; i < 4; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-acc',
        vendor: 'Uber',
        predicted: { fromAccount: 'SAB' },
        confirmed: { fromAccount: 'SAB' },
        fromAccountDeterministic: true,
      });
    }

    const promoted = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-acc',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['****7413'],
    });

    expect(promoted.promotedScores.fromAccount).toBe(0.85);
    expect(promoted.promotedFields.fromAccount).toBe('promoted');
  });

  it('rejects fromAccount promotion when accountCandidates contain invalid tokens', () => {
    vi.stubEnv('VITE_PROMOTE_FROM_ACCOUNT_CONFIDENCE', 'true');

    for (let i = 0; i < 8; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-acc-invalid',
        vendor: 'Uber',
        predicted: { fromAccount: 'SAB' },
        confirmed: { fromAccount: 'SAB' },
        fromAccountDeterministic: true,
      });
    }

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-acc-invalid',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['2026'],
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
