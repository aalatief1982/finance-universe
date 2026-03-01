import type { Transaction } from '@/types/transaction';

export type InferenceParsingStatus = 'success' | 'partial' | 'failed';

export type InferenceOrigin = 'template' | 'structure' | 'ml' | 'fallback' | 'manual';

export interface InferenceMeta {
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
  extractedFieldCount?: number;
}

export interface InferenceDTO {
  transaction: Transaction;
  rawMessage: string;
  senderHint?: string;
  templateHash?: string;
  confidence?: number;
  parsingStatus?: InferenceParsingStatus;
  origin?: InferenceOrigin;
  matchOrigin?: InferenceOrigin;
  fieldConfidences: Record<string, number>;
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
  mode: 'create' | 'edit';
  isSuggested: boolean;
  meta?: InferenceMeta;
}
