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
  });

  it('type promotion happens with >=2 POS markers and no refund markers (flag on)', () => {
    vi.stubEnv('VITE_PROMOTE_TYPE_CONFIDENCE', 'true');

    const result = applyFieldPromotionOverlay({
      rawMessage: 'شراء عبر نقاط البيع بواسطة بطاقة mada',
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.type).toBe(0.85);
    expect(result.promotedFields.type).toBe('promoted');
    expect(result.evidence[0]?.sourceKind).toBe('promoted_by_rule');
  });

  it('type promotion is blocked by refund marker', () => {
    vi.stubEnv('VITE_PROMOTE_TYPE_CONFIDENCE', 'true');

    const result = applyFieldPromotionOverlay({
      rawMessage: 'شراء عبر نقاط البيع بواسطة mada ثم استرجاع العملية',
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.type).toBeUndefined();
  });

  it('fromAccount warm promotion at >=3 confirmations with no contradictions', () => {
    vi.stubEnv('VITE_PROMOTE_FROMACCOUNT_CONFIDENCE', 'true');

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

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-acc',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fromAccountSource: 'template-default',
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['****7413'],
    });

    expect(result.promotedScores.fromAccount).toBe(0.6);
    expect(result.promotedFields.fromAccount).toBe('warming');
    expect(result.evidence[0]?.sourceKind).toBe('promoted_by_history_warm');
  });

  it('fromAccount detected promotion at >=7 confirmations with no contradictions', () => {
    vi.stubEnv('VITE_PROMOTE_FROMACCOUNT_CONFIDENCE', 'true');

    for (let i = 0; i < 7; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-acc2',
        vendor: 'Uber',
        predicted: { fromAccount: 'SAB' },
        confirmed: { fromAccount: 'SAB' },
        fromAccountDeterministic: true,
      });
    }

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-acc2',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fromAccountSource: 'template-default',
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['****7413'],
    });

    expect(result.promotedScores.fromAccount).toBe(0.85);
    expect(result.promotedFields.fromAccount).toBe('promoted');
  });

  it('fromAccount promotion is blocked when contradiction rate exceeds threshold', () => {
    vi.stubEnv('VITE_PROMOTE_FROMACCOUNT_CONFIDENCE', 'true');

    for (let i = 0; i < 7; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-acc3',
        vendor: 'Uber',
        predicted: { fromAccount: 'SAB' },
        confirmed: { fromAccount: 'SAB' },
        fromAccountDeterministic: true,
      });
    }

    recordFieldPromotionLearning({
      senderHint: 'BANK',
      templateHash: 'hash-acc3',
      vendor: 'Uber',
      predicted: { fromAccount: 'SAB' },
      confirmed: { fromAccount: 'Riyad' },
      fromAccountDeterministic: true,
    });

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-acc3',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fromAccountSource: 'template-default',
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['****7413'],
    });

    expect(result.promotedScores.fromAccount).toBeUndefined();
  });

  it('fromAccount promotion is blocked when confirmed counts are missing', () => {
    vi.stubEnv('VITE_PROMOTE_FROMACCOUNT_CONFIDENCE', 'true');

    const result = applyFieldPromotionOverlay({
      senderHint: 'BANK',
      templateHash: 'hash-acc4',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fromAccountSource: 'template-default',
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['****7413'],
    });

    expect(result.promotedScores.fromAccount).toBeUndefined();
  });

  it('flags off => no type/fromAccount promotion', () => {
    for (let i = 0; i < 8; i += 1) {
      recordFieldPromotionLearning({
        senderHint: 'BANK',
        templateHash: 'hash-acc5',
        vendor: 'Uber',
        predicted: { fromAccount: 'SAB' },
        confirmed: { fromAccount: 'SAB' },
        fromAccountDeterministic: true,
      });
    }

    const result = applyFieldPromotionOverlay({
      rawMessage: 'شراء عبر نقاط البيع بواسطة بطاقة mada',
      senderHint: 'BANK',
      templateHash: 'hash-acc5',
      vendor: 'Uber',
      fromAccountDeterministic: true,
      fromAccountSource: 'template-default',
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
      accountCandidates: ['****7413'],
    });

    expect(result.promotedScores.type).toBeUndefined();
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
