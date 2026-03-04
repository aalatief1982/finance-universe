import { safeStorage } from '@/utils/safe-storage';
import { normalizeVendorNameForCompare } from './vendorFallbackUtils';

export type PromotableField = 'category' | 'subcategory' | 'fromAccount';

export interface FieldPromotionStat {
  key: string;
  field: PromotableField;
  senderScope: string;
  templateHash: string;
  normalizedVendor: string;
  value: string;
  sampleCount: number;
  confirmedCount: number;
  contradictionCount: number;
  consecutiveConfirmedCount: number;
  lastConfirmedAt?: string;
}

type PromotionStatsStore = Record<string, FieldPromotionStat>;

interface PromotionOverlayContext {
  senderHint?: string;
  templateHash?: string;
  vendor?: string;
  fields: Partial<Record<PromotableField, { value?: string; score: number; source?: string }>>;
  fromAccountDeterministic?: boolean;
}

interface PromotionDecision {
  score?: number;
  promoted: boolean;
  stage?: 'warming' | 'promoted';
}

const STORE_KEY = 'xpensia_field_promotion_stats';
const CATEGORY_PROMOTION_SCORE = 0.85;
const FROM_ACCOUNT_WARMING_SCORE = 0.6;
const FROM_ACCOUNT_PROMOTION_SCORE = 0.85;

const getSenderScope = (senderHint?: string): string => {
  const normalized = (senderHint || '').trim().toLowerCase();
  return normalized || '__unknown__';
};

const sanitize = (value?: string): string => (value || '').trim();

const getPromotionKey = (
  field: PromotableField,
  senderScope: string,
  templateHash: string,
  normalizedVendor: string,
): string => `${field}::${senderScope}::${templateHash || '__nohash__'}::${normalizedVendor || '__novendor__'}`;

const parseStore = (raw: string | null): PromotionStatsStore => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value && typeof value === 'object'),
    ) as PromotionStatsStore;
  } catch {
    return {};
  }
};

export const loadPromotionStats = (): PromotionStatsStore => {
  return parseStore(safeStorage.getItem(STORE_KEY));
};

const savePromotionStats = (stats: PromotionStatsStore): void => {
  safeStorage.setItem(STORE_KEY, JSON.stringify(stats));
};

const isFromAccountPromotionEnabled = (): boolean => {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env || {};
  const raw = env.SMS_PROMOTE_FROMACCOUNT ?? env.VITE_SMS_PROMOTE_FROMACCOUNT ?? 'false';
  return String(raw).toLowerCase() === 'true';
};

const evaluateCategoryPromotion = (stat?: FieldPromotionStat): PromotionDecision => {
  if (!stat) return { promoted: false };
  if (stat.confirmedCount >= 3 && stat.contradictionCount === 0) {
    return { promoted: true, score: CATEGORY_PROMOTION_SCORE, stage: 'promoted' };
  }
  return { promoted: false };
};

const evaluateFromAccountPromotion = (
  stat: FieldPromotionStat | undefined,
  isDeterministic: boolean,
): PromotionDecision => {
  if (!isFromAccountPromotionEnabled() || !stat || !isDeterministic) {
    return { promoted: false };
  }

  const contradictionRate = stat.sampleCount > 0 ? stat.contradictionCount / stat.sampleCount : 1;
  if (stat.consecutiveConfirmedCount >= 7 && contradictionRate < 0.05) {
    return { promoted: true, score: FROM_ACCOUNT_PROMOTION_SCORE, stage: 'promoted' };
  }

  if (stat.confirmedCount >= 3 && contradictionRate < 0.1) {
    return { promoted: true, score: FROM_ACCOUNT_WARMING_SCORE, stage: 'warming' };
  }

  return { promoted: false };
};

export function applyFieldPromotionOverlay(context: PromotionOverlayContext): {
  promotedScores: Partial<Record<PromotableField, number>>;
  promotedFields: Partial<Record<PromotableField, 'warming' | 'promoted'>>;
} {
  const senderScope = getSenderScope(context.senderHint);
  const templateHash = sanitize(context.templateHash);
  const normalizedVendor = normalizeVendorNameForCompare(context.vendor || '');
  const stats = loadPromotionStats();

  const promotedScores: Partial<Record<PromotableField, number>> = {};
  const promotedFields: Partial<Record<PromotableField, 'warming' | 'promoted'>> = {};

  (['category', 'subcategory'] as const).forEach((field) => {
    const value = sanitize(context.fields[field]?.value);
    if (!value || !templateHash || !normalizedVendor) return;
    const key = getPromotionKey(field, senderScope, templateHash, normalizedVendor);
    const stat = stats[key];
    if (stat?.value !== value) return;

    const decision = evaluateCategoryPromotion(stat);
    if (decision.promoted && decision.score && decision.score > (context.fields[field]?.score ?? 0)) {
      promotedScores[field] = decision.score;
      promotedFields[field] = decision.stage || 'promoted';
    }
  });

  const fromAccountValue = sanitize(context.fields.fromAccount?.value);
  if (fromAccountValue && templateHash) {
    const key = getPromotionKey('fromAccount', senderScope, templateHash, normalizedVendor || '__novendor__');
    const stat = stats[key];
    if (stat?.value === fromAccountValue) {
      const decision = evaluateFromAccountPromotion(stat, Boolean(context.fromAccountDeterministic));
      if (decision.promoted && decision.score && decision.score > (context.fields.fromAccount?.score ?? 0)) {
        promotedScores.fromAccount = decision.score;
        promotedFields.fromAccount = decision.stage || 'promoted';
      }
    }
  }

  return { promotedScores, promotedFields };
}

interface RecordLearningInput {
  senderHint?: string;
  templateHash?: string;
  vendor?: string;
  predicted: Partial<Record<PromotableField, string | undefined>>;
  confirmed: Partial<Record<PromotableField, string | undefined>>;
  fromAccountDeterministic?: boolean;
}

const upsertFieldStat = (
  stats: PromotionStatsStore,
  field: PromotableField,
  senderScope: string,
  templateHash: string,
  normalizedVendor: string,
  predictedValue: string,
  confirmedValue: string,
): void => {
  const key = getPromotionKey(field, senderScope, templateHash, normalizedVendor);
  const existing = stats[key];

  const next: FieldPromotionStat = {
    key,
    field,
    senderScope,
    templateHash,
    normalizedVendor,
    value: existing?.value || predictedValue,
    sampleCount: (existing?.sampleCount || 0) + 1,
    confirmedCount: existing?.confirmedCount || 0,
    contradictionCount: existing?.contradictionCount || 0,
    consecutiveConfirmedCount: existing?.consecutiveConfirmedCount || 0,
    lastConfirmedAt: existing?.lastConfirmedAt,
  };

  const isConfirmed = predictedValue === confirmedValue;
  if (isConfirmed) {
    next.confirmedCount += 1;
    next.consecutiveConfirmedCount += 1;
    next.lastConfirmedAt = new Date().toISOString();
    next.value = confirmedValue;
  } else {
    next.contradictionCount += 1;
    next.consecutiveConfirmedCount = 0;
    // Demotion + fast adaptation to corrected value
    next.value = confirmedValue;
  }

  stats[key] = next;
};

export function recordFieldPromotionLearning(input: RecordLearningInput): void {
  const templateHash = sanitize(input.templateHash);
  if (!templateHash) return;

  const senderScope = getSenderScope(input.senderHint);
  const normalizedVendor = normalizeVendorNameForCompare(input.vendor || '');
  const stats = loadPromotionStats();

  (['category', 'subcategory'] as const).forEach((field) => {
    const predictedValue = sanitize(input.predicted[field]);
    const confirmedValue = sanitize(input.confirmed[field]);
    if (!predictedValue || !confirmedValue || !normalizedVendor) return;
    upsertFieldStat(
      stats,
      field,
      senderScope,
      templateHash,
      normalizedVendor,
      predictedValue,
      confirmedValue,
    );
  });

  const predictedFromAccount = sanitize(input.predicted.fromAccount);
  const confirmedFromAccount = sanitize(input.confirmed.fromAccount);
  if (predictedFromAccount && confirmedFromAccount && input.fromAccountDeterministic) {
    upsertFieldStat(
      stats,
      'fromAccount',
      senderScope,
      templateHash,
      normalizedVendor || '__novendor__',
      predictedFromAccount,
      confirmedFromAccount,
    );
  }

  savePromotionStats(stats);
}
