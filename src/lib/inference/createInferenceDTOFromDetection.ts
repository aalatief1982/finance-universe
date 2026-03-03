import type { Transaction } from '@/types/transaction';
import type { InferenceOrigin, InferenceParsingStatus } from '@/types/inference';
import { normalizeInferenceDTO, type InferenceDTO } from './inferenceDTO';
import type { InferenceDecisionTrace } from '@/types/inference';

interface CreateInferenceDTOFromDetectionArgs {
  transaction: Transaction;
  rawMessage?: string;
  senderHint?: string;
  confidence?: number;
  parsingStatus?: InferenceParsingStatus;
  origin?: InferenceOrigin;
  matchOrigin?: InferenceOrigin;
  fieldConfidences?: Record<string, number>;
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
  mode?: 'create' | 'edit';
  isSuggested?: boolean;
  source?: Transaction['source'];
  debugTrace?: InferenceDecisionTrace;
}

export function createInferenceDTOFromDetection({
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
  mode = 'create',
  isSuggested = true,
  source,
  debugTrace,
}: CreateInferenceDTOFromDetectionArgs): InferenceDTO {
  return normalizeInferenceDTO({
    transaction: {
      ...transaction,
      source: source ?? transaction.source,
    },
    rawMessage,
    senderHint,
    confidence,
    parsingStatus,
    origin,
    matchOrigin: matchOrigin ?? origin,
    fieldConfidences,
    matchedCount,
    totalTemplates,
    fieldScore,
    keywordScore,
    mode,
    isSuggested,
    debugTrace,
  });
}

