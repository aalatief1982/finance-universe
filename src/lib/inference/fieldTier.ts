import type { Transaction } from '@/types/transaction';
import type { InferenceOrigin, InferenceParsingStatus } from '@/types/inference';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface FieldTierResult {
  tier: ConfidenceTier;
  score: number;
}

export interface ResolveFieldTierOptions {
  fieldConfidences?: Partial<Record<keyof Transaction | string, number>>;
  confidence?: number;
  origin?: InferenceOrigin | null;
  matchOrigin?: InferenceOrigin | null;
  parsingStatus?: InferenceParsingStatus | null;
  transaction?: Partial<Transaction>;
}

const MEDIUM_HIGH_ORIGIN_FIELDS = new Set<keyof Transaction>(['amount', 'date']);
const MEDIUM_ORIGIN_FIELDS = new Set<keyof Transaction>([
  'vendor',
  'fromAccount',
  'toAccount',
  'category',
  'subcategory',
  'type',
  'currency',
]);

const hasValue = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return Boolean(value);
};

const getTierFromScore = (score: number): ConfidenceTier => {
  if (score >= 0.8) {
    return 'high';
  }

  if (score >= 0.45) {
    return 'medium';
  }

  return 'low';
};

const getFallbackScoreFromOrigin = (
  field: keyof Transaction,
  origin: InferenceOrigin | null,
  transaction?: Partial<Transaction>,
): number => {
  const value = transaction?.[field];
  if (!hasValue(value)) {
    return 0;
  }

  if (origin === 'template' || origin === 'ml' || origin === 'fallback') {
    if (MEDIUM_HIGH_ORIGIN_FIELDS.has(field)) {
      return 0.75;
    }

    if (MEDIUM_ORIGIN_FIELDS.has(field)) {
      return 0.6;
    }

    return 0.45;
  }

  if (origin === 'structure') {
    return MEDIUM_HIGH_ORIGIN_FIELDS.has(field) ? 0.5 : 0.25;
  }

  return 0.25;
};

export function resolveFieldTier(
  field: keyof Transaction,
  options: ResolveFieldTierOptions = {},
): FieldTierResult {
  const {
    fieldConfidences = {},
    origin,
    matchOrigin,
    parsingStatus,
    transaction,
  } = options;

  const rawScore = fieldConfidences[field as string];
  const scoreFromConfidence =
    typeof rawScore === 'number' && Number.isFinite(rawScore)
      ? rawScore
      : undefined;

  let score =
    scoreFromConfidence ??
    getFallbackScoreFromOrigin(field, matchOrigin ?? origin ?? null, transaction);

  if (parsingStatus === 'failed') {
    score = Math.min(score, 0.4);
  } else if (parsingStatus === 'partial') {
    score = Math.min(score, 0.65);
  }

  return {
    score,
    tier: getTierFromScore(score),
  };
}

export function isFieldTierHigh(
  field: keyof Transaction,
  options: ResolveFieldTierOptions = {},
): boolean {
  return resolveFieldTier(field, options).tier === 'high';
}
