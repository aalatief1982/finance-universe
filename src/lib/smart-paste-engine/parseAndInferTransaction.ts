/**
 * @file parseAndInferTransaction.ts
 * @description Main entry point for Smart Paste transaction parsing.
 *              Combines template matching, field extraction, and confidence scoring.
 *
 * @responsibilities
 * - Parse raw SMS message into transaction fields
 * - Calculate field-level and overall confidence scores
 * - Track template failures for retraining
 * - Log parsing failures for debugging
 *
 * @dependencies
 * - structureParser.ts: parseSmsMessage for template/field extraction
 * - keywordBankUtils.ts: loadKeywordBank for inference
 * - templateUtils.ts: getAllTemplates, incrementTemplateFailure
 * - confidenceScoring.ts: confidence calculation functions
 * - parsingLogger.ts: failure logging
 *
 * @review-checklist
 * - [ ] Confidence thresholds: >=0.8 success, >=0.4 partial, <0.4 failed
 * - [ ] Template failure incremented only on matched + failed
 * - [ ] Transaction type defaults to 'expense' if not inferred
 *
 * @review-tags
 * - @review-focus: Confidence calculation (lines 125-133)
 * - @review-risk: Template failure tracking on matched+failed
 */

import { Transaction, TransactionType } from '@/types/transaction';
import { nanoid } from 'nanoid';
import { parseSmsMessage } from './structureParser';
import { loadKeywordBank } from './keywordBankUtils';
import { getAllTemplates, incrementTemplateFailure } from './templateUtils';
import { logParsingFailure } from '@/utils/parsingLogger';
import {
  getFieldConfidence,
  getTemplateConfidence,
  getKeywordConfidence,
  computeOverallConfidence,
} from './confidenceScoring';
import { applyFieldPromotionOverlay } from './fieldPromotionOverlay';
import type { InferenceDecisionTrace } from '@/types/inference';
import { ensureOperationalTrace, ParserTraceTimer } from './parserTrace';

type DebugCandidate = NonNullable<InferenceDecisionTrace['fields'][number]['candidates']>[number];

// ============================================================================
// SECTION: String Similarity Utilities
// PURPOSE: Calculate similarity between template structures
// REVIEW: Used for slight match detection when exact match fails
// ============================================================================

/**
 * Calculate similarity ratio between two strings.
 * Uses Levenshtein distance normalized by length.
 */
function getSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// SECTION: Result Type Definition
// ============================================================================

export interface ParsedTransactionResult {
  transaction: Transaction;
  confidence: number;
  origin: 'template' | 'structure' | 'ml' | 'fallback';
  parsed: ReturnType<typeof parseSmsMessage>;
  fieldConfidences: Record<string, number>;
  parsingStatus: 'success' | 'partial' | 'failed';
  matchedCount: number;
  totalTemplates: number;
  fieldScore: number;
  keywordScore: number;
  debugTrace: InferenceDecisionTrace;
}

// ============================================================================
// SECTION: Main Parsing Function
// PURPOSE: Parse SMS and compute confidence-weighted transaction
// REVIEW: Confidence thresholds determine parsing status
// ============================================================================

/**
 * Parse a raw SMS message and infer transaction fields.
 * Returns transaction with confidence scores for UI display.
 *
 * @param rawMessage - Raw SMS text
 * @param senderHint - SMS sender identifier (e.g., "ALRAJHI")
 * @param smsId - Optional SMS ID for failure logging
 * @returns Parsed transaction with confidence metadata
 *
 * @review-focus
 * - Confidence scoring: field (40%) + template (40%) + keyword (20%)
 * - Status thresholds: >=0.8 success, >=0.4 partial, <0.4 failed
 * - Template failure tracked when matched template produces failed status
 */
export async function parseAndInferTransaction(
  rawMessage: string,
  senderHint?: string,
  smsId?: string,
): Promise<ParsedTransactionResult> {
  const timer = new ParserTraceTimer();
  const debugTrace: InferenceDecisionTrace = {
    confidenceBreakdown: {
      fieldScore: 0,
      templateScore: 0,
      keywordScore: 0,
      overallConfidence: 0,
    },
    templateSelection: {
      selected: 'structure',
      reason: 'Pending parse.',
      candidates: [],
    },
    fields: [],
  };
  const operational = ensureOperationalTrace(debugTrace);
  operational.rawInputLength = rawMessage.length;

  const parsed = parseSmsMessage(rawMessage, senderHint, debugTrace);
  const debugAccountInference =
    import.meta.env.VITE_DEBUG_ACCOUNT_INFERENCE === 'true';
  const inferredType =
    (parsed.inferredFields.type?.value as TransactionType) || 'expense';

  const resolvedFromAccount =
    parsed.directFields.fromAccount?.value ||
    parsed.inferredFields.fromAccount?.value ||
    parsed.defaultValues?.fromAccount?.value ||
    (inferredType === 'expense' || inferredType === 'transfer'
      ? senderHint || ''
      : '');

  const resolvedToAccount =
    parsed.directFields.toAccount?.value ||
    parsed.inferredFields.toAccount?.value ||
    parsed.defaultValues?.toAccount?.value ||
    (inferredType === 'income' ? senderHint || '' : '');

  if (debugAccountInference) {
    const fromAccountSource = parsed.directFields.fromAccount?.value
      ? parsed.accountInference?.fromAccountSource || 'direct-field'
      : parsed.defaultValues?.fromAccount?.value
        ? parsed.accountInference?.fromAccountSource || 'template-default'
        : inferredType === 'expense' || inferredType === 'transfer'
          ? 'senderHint-fallback'
          : 'empty';

    const toAccountSource = parsed.directFields.toAccount?.value
      ? parsed.accountInference?.toAccountSource || 'direct-field'
      : parsed.defaultValues?.toAccount?.value
        ? parsed.accountInference?.toAccountSource || 'template-default'
        : inferredType === 'income'
          ? 'senderHint-fallback'
          : 'empty';

    console.log('[AccountInference:parseAndInferTransaction]', {
      templateHash: parsed.templateHash,
      templateHashAccountMapHit:
        parsed.accountInference?.templateHashAccountMapHit || false,
      type: inferredType,
      fromAccountSource,
      toAccountSource,
      fromAccount: resolvedFromAccount,
      toAccount: resolvedToAccount,
    });
  }

  // Build transaction from parsed fields
  const detectedVendorToken = parsed.directFields.vendor?.value || '';

  timer.start('final_merge');
  const transaction: Transaction = {
    id: nanoid(),
    amount: parseFloat(parsed.directFields.amount?.value || '0'),
    currency: parsed.directFields.currency?.value || 'SAR',
    date: parsed.directFields.date?.value || '',
    type: inferredType,
    category: parsed.inferredFields.category?.value || 'Uncategorized',
    subcategory: parsed.inferredFields.subcategory?.value || 'none',
    vendor:
      parsed.inferredFields.vendor?.value ||
      parsed.directFields.vendor?.value ||
      '',
    fromAccount: resolvedFromAccount,
    toAccount: resolvedToAccount,
    source: 'smart-paste',
    createdAt: new Date().toISOString(),
    title: '', // Editable in form later
    details: {
      rawMessage,
      detectedVendorToken,
    },
  };
  timer.end('final_merge', debugTrace);

  // Load inference data
  const keywordBank = loadKeywordBank();
  const templates = getAllTemplates();
  operational.counters!.totalTemplatesAvailable = templates.length;
  operational.counters!.localMapsConsulted!.templateBank = true;

  // ============================================================================
  // Template Confidence Calculation
  // PURPOSE: Score based on exact or slight template match
  // REVIEW: Slight match threshold is 70% similarity
  // ============================================================================

  let templateMatched = 0;
  const totalTemplates = templates.length;
  const candidateTemplateScores: Array<{ template: string; similarity: number }> = [];

  if (parsed.matched) {
    // Exact template match
    templateMatched = 1;
  } else {
    timer.start('template_similarity_fallback');
    // Check for slight matches - if template structure is similar to existing ones
    const currentStructure = parsed.template;
    let scanned = 0;
    const similarTemplates = templates.filter((t) => {
      scanned += 1;
      const similarity = getSimilarity(currentStructure, t.template);
      candidateTemplateScores.push({
        template: t.template,
        similarity,
      });
      return similarity > 0.7; // 70% similarity threshold
    });

    if (similarTemplates.length > 0) {
      templateMatched = 0.6; // Partial confidence for slight matches
    }
    operational.counters!.templatesScanned = scanned;
    timer.end('template_similarity_fallback', debugTrace);
  }
  if (parsed.matched) {
    operational.counters!.templatesScanned = 1;
  }

  // Calculate component confidence scores
  const fieldScore = getFieldConfidence(parsed);
  const templateScore = getTemplateConfidence(templateMatched, totalTemplates);
  const keywordScore = getKeywordConfidence(transaction, keywordBank);

  const finalConfidence = computeOverallConfidence(
    fieldScore,
    templateScore,
    keywordScore,
  );

  // Build field-level confidence map
  const fields = [
    'amount',
    'currency',
    'date',
    'type',
    'category',
    'subcategory',
    'vendor',
    'fromAccount',
  ];
  const fieldConfidences: Record<string, number> = {};

  const resolveConfidence = (
    fieldName: string,
    source: 'direct' | 'inferred' | 'default',
    rawScore?: number,
  ) => {
    if (typeof rawScore === 'number' && rawScore > 0) {
      return rawScore;
    }

    if (source === 'inferred') {
      return 0.3;
    }

    return 0;
  };

  fields.forEach((f) => {
    if (parsed.directFields?.[f]) {
      fieldConfidences[f] = resolveConfidence(
        f,
        'direct',
        parsed.directFields[f].confidenceScore,
      );
      return;
    }

    if (f === 'fromAccount' && parsed.directFields?.account) {
      fieldConfidences[f] = 0.5;
      return;
    }

    if (parsed.inferredFields?.[f]) {
      fieldConfidences[f] = resolveConfidence(
        f,
        'inferred',
        parsed.inferredFields[f].confidenceScore,
      );
      return;
    }

    if (parsed.defaultValues?.[f]) {
      fieldConfidences[f] = resolveConfidence(
        f,
        'default',
        parsed.defaultValues[f].confidenceScore,
      );
      return;
    }

    fieldConfidences[f] = 0;
  });

  const promotionOverlay = applyFieldPromotionOverlay({
    senderHint,
    templateHash: parsed.templateHash,
    vendor: transaction.vendor,
    templateExactMatch: parsed.matched,
    accountToken: parsed.directFields?.account?.value || parsed.candidates.accountCandidates[0],
    rawMessage,
    accountCandidates: parsed.candidates.accountCandidates,
    fields: {
      vendor: {
        value: transaction.vendor,
        score: parsed.directFields?.vendor ? parsed.directFields.vendor.confidenceScore : parsed.inferredFields?.vendor ? parsed.inferredFields.vendor.confidenceScore : 0,
        sourceKind: parsed.directFields?.vendor ? 'direct_extract' : parsed.inferredFields?.vendor ? 'heuristic' : 'default',
      },
      type: {
        value: transaction.type,
        score: fieldConfidences.type ?? 0,
        source: parsed.directFields?.type ? 'direct' : parsed.inferredFields?.type ? 'inferred' : parsed.defaultValues?.type ? 'default' : 'empty',
      },
      category: {
        value: transaction.category,
        score: fieldConfidences.category ?? 0,
        source: parsed.directFields?.category ? 'direct' : parsed.inferredFields?.category ? 'inferred' : parsed.defaultValues?.category ? 'default' : 'empty',
      },
      subcategory: {
        value: transaction.subcategory,
        score: fieldConfidences.subcategory ?? 0,
        source: parsed.directFields?.subcategory ? 'direct' : parsed.inferredFields?.subcategory ? 'inferred' : parsed.defaultValues?.subcategory ? 'default' : 'empty',
      },
      fromAccount: {
        value: transaction.fromAccount,
        score: fieldConfidences.fromAccount ?? 0,
        source: parsed.directFields?.fromAccount ? 'direct' : parsed.inferredFields?.fromAccount ? 'inferred' : parsed.defaultValues?.fromAccount ? 'default' : 'empty',
      },
    },
    fromAccountDeterministic: ['token-remap', 'template-hash-map', 'template-default', 'direct-field'].includes(
      parsed.accountInference?.fromAccountSource || '',
    ),
    fromAccountSource: parsed.accountInference?.fromAccountSource,
  });

  Object.entries(promotionOverlay.promotedScores).forEach(([field, score]) => {
    if (typeof score === 'number') {
      fieldConfidences[field] = score;
    }
  });

  const fieldTrace: InferenceDecisionTrace['fields'] = fields.map((field) => {
    const direct = parsed.directFields?.[field];
    const inferred = parsed.inferredFields?.[field];
    const fallbackDefault = parsed.defaultValues?.[field];
    const chosen = direct || inferred || fallbackDefault;
    const inferenceDebug = parsed.inferenceDebug?.[field];
    const source = direct
      ? 'direct'
      : inferred
        ? 'inferred'
        : fallbackDefault
          ? 'default'
          : 'empty';

    const score = fieldConfidences[field] ?? 0;
    const promotionStage = promotionOverlay.promotedFields[field as 'fromAccount' | 'type'];
    const promotionEvidence = promotionOverlay.evidence.find((entry) => entry.field === field);
    const tier = score >= 0.8 ? 'detected' : score >= 0.4 ? 'suggested' : 'needs_review';
    const evidence: string[] = [];

    if (direct) evidence.push(`Direct extraction: ${String(direct.value)}`);
    if (inferred) evidence.push(`Inferred suggestion: ${String(inferred.value)}`);
    if (fallbackDefault) evidence.push(`Template default: ${String(fallbackDefault.value)}`);
    if (inferenceDebug?.selectionReason) evidence.push(inferenceDebug.selectionReason);
    if (field === 'type' && !direct && !inferred && !fallbackDefault) {
      evidence.push('No direct/inferred/default type candidate found; defaulted to expense in parseAndInferTransaction.');
    }
    if (field === 'fromAccount' && parsed.directFields?.account?.value) {
      evidence.push(`Derived from account token: ${parsed.directFields.account.value}`);
    }
    if (promotionStage === 'promoted') {
      evidence.push(promotionEvidence?.message || 'Promoted by historical confirmation overlay.');
    }

    const alternatives = [
      direct && { value: direct.value, score: direct.confidenceScore, reason: 'direct' },
      inferred && { value: inferred.value, score: inferred.confidenceScore, reason: 'inferred' },
      fallbackDefault && { value: fallbackDefault.value, score: fallbackDefault.confidenceScore, reason: 'default' },
    ].filter(Boolean) as Array<{ value: unknown; score: number; reason: string }>;

    const rankedCandidates: DebugCandidate[] =
      inferenceDebug?.candidates?.slice(0, 5) ||
      [
        direct && {
          value: String(direct.value),
          score: direct.confidenceScore,
          reason: source === 'direct' ? 'chosen_direct_extraction' : 'not_selected_direct_extraction',
          sourceKind: 'direct_extract',
          matchedText: String(direct.value),
          ruleId: 'direct_field_parse',
        },
        inferred && {
          value: String(inferred.value),
          score: inferred.confidenceScore,
          reason: source === 'inferred' ? 'chosen_inferred_suggestion' : 'not_selected_inferred_suggestion',
          sourceKind: 'heuristic',
          matchedText: String(inferred.value),
          ruleId: 'inferred_field_parse',
        },
        fallbackDefault && {
          value: String(fallbackDefault.value),
          score: fallbackDefault.confidenceScore,
          reason: source === 'default' ? 'chosen_template_default' : 'not_selected_template_default',
          sourceKind: 'template_default',
          matchedText: String(fallbackDefault.value),
          ruleId: 'template_default_field',
        },
      ].filter(Boolean) as DebugCandidate[];

    if (field === 'type' && rankedCandidates.length === 0) {
      rankedCandidates.push({
        value: transaction.type,
        score: 0,
        reason: 'chosen_parser_default_type',
        sourceKind: 'default',
        matchedText: transaction.type,
        ruleId: 'parseAndInferTransaction:type_default_expense',
      });
    }

    const topCandidates = rankedCandidates;

    return {
      field,
      finalValue: chosen?.value ?? (field === 'type' ? transaction.type : null),
      score,
      source,
      sourceKind:
        (promotionEvidence?.sourceKind || inferenceDebug?.sourceKind) ||
        (direct
          ? 'direct_extract'
          : inferred
            ? 'keyword_bank'
            : fallbackDefault
              ? 'template_default'
              : field === 'type'
                ? 'default'
                : undefined),
      tier,
      evidence,
      matchedText: inferenceDebug?.matchedText || topCandidates.map((candidate) => candidate.matchedText || '').filter(Boolean),
      ruleId:
        promotionEvidence?.ruleId ||
        inferenceDebug?.ruleId ||
        (field === 'type' && !inferenceDebug ? 'parseAndInferTransaction:type_resolution' : undefined),
      mappingId: inferenceDebug?.mappingId,
      breakdown: {
        directScore: direct?.confidenceScore,
        inferredScore: inferred?.confidenceScore,
        defaultScore: fallbackDefault?.confidenceScore,
        selectedCandidateScore: topCandidates[0]?.score,
        selectionDelta:
          topCandidates.length > 1
            ? Number((topCandidates[0].score - topCandidates[1].score).toFixed(3))
            : undefined,
      },
      alternatives,
      candidates: topCandidates,
    };
  });

  // Determine parsing status based on confidence thresholds
  const parsingStatus: ParsedTransactionResult['parsingStatus'] =
    finalConfidence >= 0.8
      ? 'success'
      : finalConfidence >= 0.4
        ? 'partial'
        : 'failed';

  const origin: ParsedTransactionResult['origin'] = parsed.matched
    ? 'template'
    : 'structure';

  debugTrace.confidenceBreakdown = {
    fieldScore,
    templateScore,
    keywordScore,
    overallConfidence: finalConfidence,
  };
  debugTrace.templateSelection = {
    selected: origin,
    reason: parsed.matched
      ? 'Exact template hash match found.'
      : templateMatched > 0
        ? 'No exact match; selected best structure fallback based on similarity threshold.'
        : 'No close template match; structure-only parse used.',
    candidates: candidateTemplateScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5),
  };
  debugTrace.accountCandidates = parsed.candidates.accountCandidates;
  debugTrace.fields = fieldTrace;
  debugTrace.promotionOverlay = {
    promotedFields: promotionOverlay.promotedFields,
    evidence: promotionOverlay.evidence,
  };

  operational.templateExactHit = parsed.matched;
  operational.similarityFallbackUsed = !parsed.matched && templateMatched > 0;
  operational.freeformFallbackUsed = false;
  operational.finalConfidence = finalConfidence;
  operational.finalSources = {
    amount: fieldTrace.find((f) => f.field === 'amount')?.sourceKind || fieldTrace.find((f) => f.field === 'amount')?.source,
    vendor: fieldTrace.find((f) => f.field === 'vendor')?.sourceKind || fieldTrace.find((f) => f.field === 'vendor')?.source,
    date: fieldTrace.find((f) => f.field === 'date')?.sourceKind || fieldTrace.find((f) => f.field === 'date')?.source,
    type: fieldTrace.find((f) => f.field === 'type')?.sourceKind || fieldTrace.find((f) => f.field === 'type')?.source,
    category: fieldTrace.find((f) => f.field === 'category')?.sourceKind || fieldTrace.find((f) => f.field === 'category')?.source,
    subcategory: fieldTrace.find((f) => f.field === 'subcategory')?.sourceKind || fieldTrace.find((f) => f.field === 'subcategory')?.source,
  };
  (['type', 'category', 'subcategory', 'vendor'] as const).forEach((fieldName) => {
    const field = fieldTrace.find((item) => item.field === fieldName);
    if (!field) return;
    operational.winners![fieldName] = {
      winner: String(field.candidates?.[0]?.value ?? field.finalValue ?? ''),
      winnerScore: field.candidates?.[0]?.score ?? field.score,
      runnerUp: field.candidates?.[1] ? String(field.candidates[1].value) : undefined,
      runnerUpScore: field.candidates?.[1]?.score,
    };
  });

  // Track template failure if matched but still failed
  // This triggers retraining flow after N failures
  if (parsed.matched && parsingStatus === 'failed') {
    incrementTemplateFailure(
      parsed.templateHash,
      senderHint,
      rawMessage,
      parsed.template,
    );
  }

  // Log parsing failure for debugging
  if (parsingStatus === 'failed' && smsId) {
    logParsingFailure(smsId);
  }

  return {
    transaction,
    confidence: finalConfidence,
    origin,
    parsed,
    fieldConfidences,
    parsingStatus,
    matchedCount: templateMatched,
    totalTemplates: templates.length,
    fieldScore,
    keywordScore,
    debugTrace,
  };
}
