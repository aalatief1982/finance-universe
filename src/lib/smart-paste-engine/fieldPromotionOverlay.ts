import { safeStorage } from '@/utils/safe-storage';
import { normalizeVendorNameForCompare } from './vendorFallbackUtils';

export type PromotableField = 'category' | 'subcategory' | 'fromAccount' | 'type';

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
  rawMessage?: string;
  accountCandidates?: string[];
  fields: Partial<Record<PromotableField, { value?: string; score: number; source?: string }>>;
  fromAccountDeterministic?: boolean;
  fromAccountSource?: string;
}

interface PromotionEvidence {
  field: 'type' | 'fromAccount';
  sourceKind: 'promoted_by_rule' | 'promoted_by_history' | 'promoted_by_history_warm';
  ruleId: string;
  matchedText?: string;
  sampleCount?: number;
  contradictionCount?: number;
  mappingKey?: string;
  message: string;
}

interface PromotionDecision {
  score?: number;
  promoted: boolean;
  stage?: 'warming' | 'promoted';
}

const STORE_KEY = 'xpensia_field_promotion_stats';
const RELIABILITY_STORE_KEY = 'xpensia_field_reliability_stats';
const CATEGORY_PROMOTION_SCORE = 0.85;
const TYPE_PROMOTION_SCORE = 0.85;
const FROM_ACCOUNT_WARMING_SCORE = 0.6;
const FROM_ACCOUNT_PROMOTION_SCORE = 0.85;
const FROM_ACCOUNT_WARMING_CONFIRMATIONS = 3;
const FROM_ACCOUNT_PROMOTE_CONFIRMATIONS = 7;
const MAX_CONTRADICTION_RATE = 0.05;

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

interface FieldReliabilityStat {
  key: string;
  contextKey: string;
  fieldName: 'type' | 'fromAccount';
  value: string;
  templateHash: string;
  normalizedVendor: string;
  confirmCount: number;
  contradictionCount: number;
  lastConfirmedAt?: string;
}

type FieldReliabilityStore = Record<string, FieldReliabilityStat>;

const parseReliabilityStore = (raw: string | null): FieldReliabilityStore => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as FieldReliabilityStore;
  } catch {
    return {};
  }
};

const loadFieldReliabilityStats = (): FieldReliabilityStore => {
  return parseReliabilityStore(safeStorage.getItem(RELIABILITY_STORE_KEY));
};

const saveFieldReliabilityStats = (stats: FieldReliabilityStore): void => {
  safeStorage.setItem(RELIABILITY_STORE_KEY, JSON.stringify(stats));
};

const getContextKey = (senderScope: string, templateHash: string, normalizedVendor: string): string =>
  `${senderScope || '__unknown__'}:${templateHash || '__nohash__'}:${normalizedVendor || '__novendor__'}`;

const getReliabilityKey = (
  contextKey: string,
  fieldName: 'type' | 'fromAccount',
  value: string,
): string => `${contextKey}:${fieldName}:${value}`;

const isFeatureEnabled = (flagName: 'PROMOTE_TYPE_CONFIDENCE' | 'PROMOTE_FROMACCOUNT_CONFIDENCE'): boolean => {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env || {};
  const processEnv = typeof process !== 'undefined' ? process.env : undefined;
  const raw =
    env[flagName] ??
    env[`VITE_${flagName}`] ??
    processEnv?.[flagName] ??
    processEnv?.[`VITE_${flagName}`] ??
    (flagName === 'PROMOTE_FROMACCOUNT_CONFIDENCE'
      ? env.PROMOTE_FROM_ACCOUNT_CONFIDENCE ??
        env.VITE_PROMOTE_FROM_ACCOUNT_CONFIDENCE ??
        processEnv?.PROMOTE_FROM_ACCOUNT_CONFIDENCE ??
        processEnv?.VITE_PROMOTE_FROM_ACCOUNT_CONFIDENCE
      : undefined) ??
    'false';
  return String(raw).toLowerCase() === 'true';
};

const evaluateCategoryPromotion = (stat?: FieldPromotionStat): PromotionDecision => {
  if (!stat) return { promoted: false };
  if (stat.confirmedCount >= 3 && stat.contradictionCount === 0) {
    return { promoted: true, score: CATEGORY_PROMOTION_SCORE, stage: 'promoted' };
  }
  return { promoted: false };
};

const POS_MARKERS = ['شراء عبر نقاط البيع', 'نقاط البيع', 'pos', 'mada', 'samsung pay', 'apple pay', 'بطاقة', 'شراء'];
const REVERSAL_MARKERS = ['استرجاع', 'مرتجع', 'عكس', 'إلغاء', 'refund', 'reversal', 'chargeback', 'reverse', 'عكس القيد'];

const normalizeInput = (value: string): string => value.toLowerCase();

const getMatchedMarkers = (haystack: string, markers: string[]): string[] =>
  markers.filter((marker) => haystack.includes(marker.toLowerCase()));

const isInvalidAccountCandidate = (candidate: string): boolean => {
  const value = candidate.trim();
  if (!value) return false;
  if (/^\d{4}$/.test(value) && Number(value) >= 2000 && Number(value) <= 2100) return true;
  if (/^\d+(\.\d+)?$/.test(value)) return true;
  if (/^[A-Z0-9]{8,}$/.test(value) && /\d{4,}/.test(value)) return true;
  return false;
};

export function promoteTypeConfidenceIfEligible(context: PromotionOverlayContext): {
  score?: number;
  evidence?: PromotionEvidence;
} {
  if (!isFeatureEnabled('PROMOTE_TYPE_CONFIDENCE')) return {};
  const typeField = context.fields.type;
  if (!typeField || (typeField.score ?? 0) >= 0.8) return {};
  if (typeField.value && typeField.value !== 'expense') return {};

  const normalizedMessage = normalizeInput(context.rawMessage || '');
  const matchedPos = getMatchedMarkers(normalizedMessage, POS_MARKERS);
  const matchedReversal = getMatchedMarkers(normalizedMessage, REVERSAL_MARKERS);

  if (matchedPos.length >= 2 && matchedReversal.length === 0) {
    return {
      score: TYPE_PROMOTION_SCORE,
      evidence: {
        field: 'type',
        sourceKind: 'promoted_by_rule',
        ruleId: 'type_promotion:pos_markers',
        matchedText: matchedPos.join(', '),
        message: `Promoted by rule: POS markers matched: ${matchedPos.join(', ')}; no refund markers detected.`,
      },
    };
  }

  return {};
}

export function promoteFromAccountConfidenceIfEligible(context: PromotionOverlayContext): {
  score?: number;
  stage?: 'warming' | 'promoted';
  evidence?: PromotionEvidence;
} {
  if (!isFeatureEnabled('PROMOTE_FROMACCOUNT_CONFIDENCE')) return {};
  const fromAccount = context.fields.fromAccount;
  if (!fromAccount || (fromAccount.score ?? 0) >= 0.8) return {};
  if (!context.fromAccountDeterministic) return {};

  const cameFromExtractionPath = ['direct-field', 'token-remap'].includes(context.fromAccountSource || '');
  const hasInvalidCandidate = (context.accountCandidates || []).some(isInvalidAccountCandidate);
  if (cameFromExtractionPath && hasInvalidCandidate) return {};

  const senderScope = getSenderScope(context.senderHint);
  const normalizedVendor = normalizeVendorNameForCompare(context.vendor || '') || '__novendor__';
  const templateHash = sanitize(context.templateHash);
  const contextKey = getContextKey(senderScope, templateHash, normalizedVendor);
  const statKey = getReliabilityKey(contextKey, 'fromAccount', sanitize(fromAccount.value));
  const reliability = loadFieldReliabilityStats()[statKey];
  if (!reliability) return {};

  const totalCount = reliability.confirmCount + reliability.contradictionCount;
  const contradictionRate = totalCount > 0 ? reliability.contradictionCount / totalCount : 1;
  if (reliability.confirmCount <= 0 || contradictionRate > MAX_CONTRADICTION_RATE) return {};

  if (reliability.confirmCount >= FROM_ACCOUNT_PROMOTE_CONFIRMATIONS) {
    return {
      score: FROM_ACCOUNT_PROMOTION_SCORE,
      stage: 'promoted',
      evidence: {
        field: 'fromAccount',
        sourceKind: 'promoted_by_history',
        ruleId: 'from_account_promotion:reliability_promoted',
        sampleCount: reliability.confirmCount,
        contradictionCount: reliability.contradictionCount,
        mappingKey: statKey,
        message: `Promoted by history: ${fromAccount.value} confirmed ${reliability.confirmCount} times for contextKey ${contextKey}; contradictionRate ${(contradictionRate * 100).toFixed(1)}%.`,
      },
    };
  }

  if (reliability.confirmCount >= FROM_ACCOUNT_WARMING_CONFIRMATIONS) {
    return {
      score: FROM_ACCOUNT_WARMING_SCORE,
      stage: 'warming',
      evidence: {
        field: 'fromAccount',
        sourceKind: 'promoted_by_history_warm',
        ruleId: 'from_account_promotion:reliability_warming',
        sampleCount: reliability.confirmCount,
        contradictionCount: reliability.contradictionCount,
        mappingKey: statKey,
        message: `Promoted by history (warm): ${fromAccount.value} confirmed ${reliability.confirmCount} times for contextKey ${contextKey}; contradictionRate ${(contradictionRate * 100).toFixed(1)}%.`,
      },
    };
  }

  return {};
}

export function applyFieldPromotionOverlay(context: PromotionOverlayContext): {
  promotedScores: Partial<Record<PromotableField, number>>;
  promotedFields: Partial<Record<PromotableField, 'warming' | 'promoted'>>;
  evidence: PromotionEvidence[];
} {
  const senderScope = getSenderScope(context.senderHint);
  const templateHash = sanitize(context.templateHash);
  const normalizedVendor = normalizeVendorNameForCompare(context.vendor || '');
  const stats = loadPromotionStats();

  const promotedScores: Partial<Record<PromotableField, number>> = {};
  const promotedFields: Partial<Record<PromotableField, 'warming' | 'promoted'>> = {};
  const evidence: PromotionEvidence[] = [];

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

  const typePromotion = promoteTypeConfidenceIfEligible(context);
  if (typePromotion.score && typePromotion.score > (context.fields.type?.score ?? 0)) {
    promotedScores.type = typePromotion.score;
    promotedFields.type = 'promoted';
    if (typePromotion.evidence) evidence.push(typePromotion.evidence);
  }

  const fromAccountPromotion = promoteFromAccountConfidenceIfEligible(context);
  if (
    fromAccountPromotion.score &&
    fromAccountPromotion.score > (promotedScores.fromAccount ?? context.fields.fromAccount?.score ?? 0)
  ) {
    promotedScores.fromAccount = fromAccountPromotion.score;
    promotedFields.fromAccount = fromAccountPromotion.stage || 'promoted';
    if (fromAccountPromotion.evidence) evidence.push(fromAccountPromotion.evidence);
  }

  return { promotedScores, promotedFields, evidence };
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
    next.value = confirmedValue;
  }

  stats[key] = next;
};

const getFieldReliabilityByContext = (
  stats: FieldReliabilityStore,
  contextKey: string,
  fieldName: 'type' | 'fromAccount',
): FieldReliabilityStat[] => {
  const prefix = `${contextKey}:${fieldName}:`;
  return Object.values(stats).filter((entry) => entry?.key?.startsWith(prefix));
};

const incrementContradictionsForOtherValues = (
  stats: FieldReliabilityStore,
  contextKey: string,
  fieldName: 'type' | 'fromAccount',
  confirmedValue: string,
): void => {
  getFieldReliabilityByContext(stats, contextKey, fieldName).forEach((entry) => {
    if (entry.value === confirmedValue) return;
    stats[entry.key] = {
      ...entry,
      contradictionCount: (entry.contradictionCount || 0) + 1,
    };
  });
};

export function recordFieldPromotionLearning(input: RecordLearningInput): void {
  const templateHash = sanitize(input.templateHash);
  if (!templateHash) return;

  const senderScope = getSenderScope(input.senderHint);
  const normalizedVendor = normalizeVendorNameForCompare(input.vendor || '') || '__novendor__';
  const stats = loadPromotionStats();
  const reliabilityStats = loadFieldReliabilityStats();

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
      normalizedVendor,
      predictedFromAccount,
      confirmedFromAccount,
    );
  }

  const contextKey = getContextKey(senderScope, templateHash, normalizedVendor);
  const upsertReliability = (
    fieldName: 'type' | 'fromAccount',
    predictedValue: string,
    confirmedValue: string,
    deterministicOnly = false,
  ) => {
    if (!confirmedValue) return;
    if (deterministicOnly && !input.fromAccountDeterministic) return;

    const key = getReliabilityKey(contextKey, fieldName, confirmedValue);
    const existing = reliabilityStats[key];
    const isConfirmedPrediction = Boolean(predictedValue) && predictedValue === confirmedValue;

    reliabilityStats[key] = {
      key,
      contextKey,
      fieldName,
      value: confirmedValue,
      templateHash,
      normalizedVendor,
      confirmCount: (existing?.confirmCount || 0) + 1,
      contradictionCount: existing?.contradictionCount || 0,
      lastConfirmedAt: new Date().toISOString(),
    };

    if (!isConfirmedPrediction) {
      incrementContradictionsForOtherValues(reliabilityStats, contextKey, fieldName, confirmedValue);
    }
  };

  upsertReliability('type', sanitize(input.predicted.type), sanitize(input.confirmed.type));
  upsertReliability('fromAccount', predictedFromAccount, confirmedFromAccount, true);

  savePromotionStats(stats);
  saveFieldReliabilityStats(reliabilityStats);
}
