import type { Transaction } from '@/types/transaction';

export interface InferenceDTO {
  transaction: Transaction;
  rawMessage: string;
  senderHint?: string;
  confidence?: number;
  parsingStatus?: 'success' | 'partial' | 'failed';
  origin?: 'template' | 'structure' | 'ml' | 'fallback' | 'manual';
  matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback' | 'manual';
  fieldConfidences: Record<string, number>;
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
  mode: 'create' | 'edit';
  isSuggested?: boolean;
  meta?: {
    matchedCount?: number;
    totalTemplates?: number;
    fieldScore?: number;
    keywordScore?: number;
    extractedFieldCount?: number;
  };
}

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const todayIsoDate = (): string => new Date().toISOString().split('T')[0];

const createFallbackTransaction = (
  rawMessage: string,
  senderHint?: string
): Transaction => ({
  id: '',
  title: senderHint ? `SMS from ${senderHint}` : 'SMS transaction',
  amount: 0,
  category: 'Uncategorized',
  subcategory: 'none',
  date: todayIsoDate(),
  type: 'expense',
  source: 'smart-paste',
  currency: 'SAR',
  fromAccount: senderHint || '',
  details: {
    rawMessage,
    sms: senderHint
      ? {
          sender: senderHint,
          message: rawMessage,
          timestamp: new Date().toISOString(),
        }
      : undefined,
  },
});

export function normalizeInferenceDTO(input: unknown): InferenceDTO {
  const source = isObject(input) ? input : {};
  const rawMessage = typeof source.rawMessage === 'string' ? source.rawMessage : '';
  const senderHint = typeof source.senderHint === 'string' ? source.senderHint : undefined;

  const candidateTransaction = source.transaction;
  const transaction = isObject(candidateTransaction)
    ? ({ ...createFallbackTransaction(rawMessage, senderHint), ...candidateTransaction } as Transaction)
    : createFallbackTransaction(rawMessage, senderHint);

  const mode = source.mode === 'edit' ? 'edit' : 'create';

  const confidence = typeof source.confidence === 'number' ? source.confidence : undefined;
  const parsingStatus = source.parsingStatus === 'success' || source.parsingStatus === 'partial' || source.parsingStatus === 'failed'
    ? source.parsingStatus
    : undefined;

  const origin =
    source.origin === 'template' ||
    source.origin === 'structure' ||
    source.origin === 'ml' ||
    source.origin === 'fallback' ||
    source.origin === 'manual'
      ? source.origin
      : undefined;

  const matchOrigin =
    source.matchOrigin === 'template' ||
    source.matchOrigin === 'structure' ||
    source.matchOrigin === 'ml' ||
    source.matchOrigin === 'fallback' ||
    source.matchOrigin === 'manual'
      ? source.matchOrigin
      : origin;

  const fieldConfidences = isObject(source.fieldConfidences)
    ? (source.fieldConfidences as Record<string, number>)
    : {};

  const matchedCount = typeof source.matchedCount === 'number' ? source.matchedCount : undefined;
  const totalTemplates = typeof source.totalTemplates === 'number' ? source.totalTemplates : undefined;
  const fieldScore = typeof source.fieldScore === 'number' ? source.fieldScore : undefined;
  const keywordScore = typeof source.keywordScore === 'number' ? source.keywordScore : undefined;

  return {
    transaction,
    rawMessage,
    senderHint,
    confidence,
    parsingStatus,
    origin,
    matchOrigin,
    fieldConfidences,
    matchedCount,
    totalTemplates,
    fieldScore,
    keywordScore,
    mode,
    isSuggested: source.isSuggested === false ? false : true,
    meta: {
      matchedCount,
      totalTemplates,
      fieldScore,
      keywordScore,
    },
  };
}
