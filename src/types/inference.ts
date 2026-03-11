import type { Transaction } from '@/types/transaction';

export type InferenceParsingStatus = 'success' | 'partial' | 'failed';

export type InferenceOrigin = 'template' | 'structure' | 'ml' | 'fallback' | 'freeform' | 'manual';

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
  sourceKind?: 'direct_extract' | 'keyword_bank' | 'template_default' | 'history_learning' | 'heuristic' | 'default' | 'promoted_by_history';
  tier: 'detected' | 'suggested' | 'needs_review';
  evidence: string[];
  matchedText?: string[];
  ruleId?: string;
  mappingId?: string;
  breakdown: {
    directScore?: number;
    inferredScore?: number;
    defaultScore?: number;
    selectedCandidateScore?: number;
    selectionDelta?: number;
  };
  alternatives?: Array<{
    value: unknown;
    score: number;
    reason: string;
  }>;
  candidates?: Array<{
    value: unknown;
    score: number;
    reason: string;
    sourceKind?: InferenceFieldTrace['sourceKind'];
    matchedText?: string;
    mappingId?: string;
    ruleId?: string;
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

  promotionOverlay?: {
    promotedFields: Partial<Record<string, 'promoted'>>;
    evidence: Array<{
      field: string;
      sourceKind: 'promoted_by_history';
      ruleId: string;
      edgeKey: string;
      valueKey: string;
      confirm: number;
      contradict: number;
      purity: number;
      freshnessDays: number;
      message: string;
    }>;
  };

  operational?: {
    rawInputLength?: number;
    financialGatePassed?: boolean;
    parseMode?: 'structured' | 'freeform' | 'rejected';
    totalParseDurationMs?: number;
    templateExactHit?: boolean;
    similarityFallbackUsed?: boolean;
    freeformFallbackUsed?: boolean;
    finalConfidence?: number;
    finalSources?: Partial<Record<'amount' | 'vendor' | 'date' | 'type' | 'category' | 'subcategory', string>>;
    stageTimingsMs?: Partial<Record<
      | 'normalize'
      | 'gate'
      | 'template_extraction'
      | 'template_exact_lookup'
      | 'template_similarity_fallback'
      | 'direct_extraction'
      | 'suggestion_engine'
      | 'vendor_fallback'
      | 'final_merge'
      | 'dto_build', number>>;
    counters?: {
      totalTemplatesAvailable?: number;
      templatesScanned?: number;
      keywordBankSize?: number;
      keywordCandidateHits?: number;
      vendorFallbackSize?: number;
      vendorCandidatesChecked?: number;
      localMapsConsulted?: {
        templateBank: boolean;
        keywordBank: boolean;
        vendorMap: boolean;
        templateAccountMap: boolean;
      };
    };
    winners?: Partial<Record<'type' | 'category' | 'subcategory' | 'vendor', {
      winner?: string;
      winnerScore?: number;
      runnerUp?: string;
      runnerUpScore?: number;
    }>>;
  };
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
