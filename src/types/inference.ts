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

export interface InferenceFieldTrace {
  field: string;
  finalValue: unknown;
  score: number;
  source: 'direct' | 'inferred' | 'default' | 'empty';
  tier: 'detected' | 'suggested' | 'needs_review';
  evidence: string[];
  breakdown: {
    directScore?: number;
    inferredScore?: number;
    defaultScore?: number;
  };
  alternatives?: Array<{
    value: unknown;
    score: number;
    reason: string;
  }>;
}

export interface InferenceDecisionTrace {
  confidenceBreakdown: {
    fieldScore: number;
    templateScore: number;
    keywordScore: number;
    overallConfidence: number;
  };
  templateSelection: {
    selected: 'template' | 'structure';
    reason: string;
    candidates?: Array<{
      template: string;
      similarity: number;
    }>;
  };
  accountCandidates?: string[];
  fields: InferenceFieldTrace[];
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
  debugTrace?: InferenceDecisionTrace;
}
