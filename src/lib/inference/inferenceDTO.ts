import type { Transaction } from '@/types/transaction';
import type {
  InferenceDTO,
  InferenceOrigin,
  InferenceParsingStatus,
} from '@/types/inference';

export type { InferenceDTO } from '@/types/inference';

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

const normalizeParsingStatus = (status: unknown): InferenceParsingStatus | undefined => (
  status === 'success' || status === 'partial' || status === 'failed' ? status : undefined
);

const normalizeOrigin = (origin: unknown): InferenceOrigin | undefined => (
  origin === 'template' ||
  origin === 'structure' ||
  origin === 'ml' ||
  origin === 'fallback' ||
  origin === 'freeform' ||
  origin === 'manual'
    ? origin
    : undefined
);

const devAssertRequiredKeys = (source: Record<string, unknown>) => {
  if (!import.meta.env.DEV) {
    return;
  }

  const missing: string[] = [];
  if (!isObject(source.transaction)) missing.push('transaction');
  if (typeof source.rawMessage !== 'string') missing.push('rawMessage');
  if (!isObject(source.fieldConfidences)) missing.push('fieldConfidences');

  if (missing.length > 0) {
    console.warn('[InferenceDTO] normalizeInferenceDTO missing required keys, applying defaults:', {
      missing,
      source,
    });
  }
};

export function normalizeInferenceDTO(input: unknown): InferenceDTO {
  const source = isObject(input) ? input : {};
  devAssertRequiredKeys(source);

  const rawMessage = typeof source.rawMessage === 'string' ? source.rawMessage : '';
  const senderHint = typeof source.senderHint === 'string' ? source.senderHint : undefined;

  const candidateTransaction = source.transaction;
  const transaction = isObject(candidateTransaction)
    ? ({ ...createFallbackTransaction(rawMessage, senderHint), ...candidateTransaction } as Transaction)
    : createFallbackTransaction(rawMessage, senderHint);

  const inferredMode = transaction.id ? 'edit' : 'create';
  const mode = source.mode === 'edit' || source.mode === 'create' ? source.mode : inferredMode;

  const confidence = typeof source.confidence === 'number' ? source.confidence : undefined;
  const parsingStatus = normalizeParsingStatus(source.parsingStatus);
  const origin = normalizeOrigin(source.origin);
  const matchOrigin = normalizeOrigin(source.matchOrigin) ?? origin;

  const fieldConfidences = isObject(source.fieldConfidences)
    ? (source.fieldConfidences as Record<string, number>)
    : {};

  const matchedCount = typeof source.matchedCount === 'number' ? source.matchedCount : undefined;
  const totalTemplates = typeof source.totalTemplates === 'number' ? source.totalTemplates : undefined;
  const fieldScore = typeof source.fieldScore === 'number' ? source.fieldScore : undefined;
  const keywordScore = typeof source.keywordScore === 'number' ? source.keywordScore : undefined;
  const templateHash = typeof source.templateHash === 'string' ? source.templateHash : undefined;
  const debugTrace = isObject(source.debugTrace) ? (source.debugTrace as unknown as InferenceDTO['debugTrace']) : undefined;

  return {
    transaction,
    rawMessage,
    senderHint,
    templateHash,
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
    debugTrace,
    meta: {
      matchedCount,
      totalTemplates,
      fieldScore,
      keywordScore,
    },
  };
}
