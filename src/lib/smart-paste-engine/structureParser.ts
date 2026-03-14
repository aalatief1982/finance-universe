/**
 * @file structureParser.ts
 * @description Parses SMS text using a structure-template-first pipeline to
 *              extract direct fields, infer missing data, and normalize values.
 *
 * @responsibilities
 * - Build or match template structures for incoming SMS messages
 * - Normalize key fields (e.g., dates) for consistent downstream use
 * - Infer indirect fields using suggestion engine heuristics
 *
 * @dependencies
 * - templateUtils.ts: template extraction and lookup
 * - suggestionEngine.ts: inferred field generation
 * - confidenceUtils.ts: confidence scoring for parsed fields
 *
 * @review-tags
 * - @risk: parsing failures should be surfaced to callers (no silent corruption)
 * - @invariant: directFields values are normalized before inference
 */
import { safeStorage } from "@/utils/safe-storage";

import { extractTemplateStructure, getTemplateByHash } from './templateUtils';
import { inferIndirectFieldsWithDebug, type FieldInferenceDebug } from './suggestionEngine';
import { computeConfidenceScore } from './confidenceUtils';
import { normalizeVendorNameForCompare } from './vendorFallbackUtils';
import { extractAccountCandidates as extractLegacyAccountCandidates } from './accountCandidates';
import {
  extractAccountCandidates as extractAccountInferenceCandidates,
  pickBestAccountCandidate,
} from './accountInference';
import { getPreferredFromAccount } from './templateHashAccountMap';
import type { InferenceDecisionTrace } from '@/types/inference';
import { ensureOperationalTrace, ParserTraceTimer } from './parserTrace';



export type ParserPlausibilityProfile = 'sms_strict' | 'manual_wide';

export type ParserContextSource = 'smart-paste' | 'sms' | 'sms-import' | 'smart-paste-freeform' | 'voice-freeform' | 'shared-text' | 'manual';

export interface ParseContext {
  anchorDate?: string | Date;
  source?: ParserContextSource;
  plausibilityProfile?: ParserPlausibilityProfile;
}

const STRICT_SOURCES: ReadonlySet<ParserContextSource> = new Set(['sms', 'sms-import', 'shared-text']);

const toAnchorDate = (anchorDate?: string | Date): Date | undefined => {
  if (!anchorDate) return undefined;
  const parsed = anchorDate instanceof Date ? anchorDate : new Date(anchorDate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const resolvePlausibilityProfile = (context?: ParseContext): ParserPlausibilityProfile => {
  if (context?.plausibilityProfile) return context.plausibilityProfile;
  if (context?.source && STRICT_SOURCES.has(context.source)) return 'sms_strict';
  return 'manual_wide';
};

const getPlausibilityWindowDays = (profile: ParserPlausibilityProfile) => (
  profile === 'sms_strict'
    ? { future: 2, past: 45 }
    : { future: 45, past: 3650 }
);

/**
 * Normalize a date string into ISO (yyyy-MM-dd) format when possible.
 *
 * @review-focus
 * - Handles short yy-mm-dd variants safely
 * - Falls back to Date parsing when format is unknown
 */
export function normalizeDate(dateStr: string, context?: ParseContext): string | undefined {
  if (!dateStr) return undefined;

  const toIsoIfValid = (year: number, month: number, day: number): string | undefined => {
    const candidate = new Date(Date.UTC(year, month - 1, day));
    const isExact =
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day;
    return isExact ? candidate.toISOString().slice(0, 10) : undefined;
  };

  const shortNumericDateMatch = dateStr
    .trim()
    .match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{1,2})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if (shortNumericDateMatch) {
    const [, part1, part2, part3] = shortNumericDateMatch;
    const p1 = parseInt(part1, 10);
    const p2 = parseInt(part2, 10);
    const p3 = parseInt(part3, 10);

    const toFullYear = (yy: number): number => (yy < 50 ? 2000 + yy : 1900 + yy);

    // Preserve previous behavior for clearly non-ambiguous values.
    const dmyIso = toIsoIfValid(toFullYear(p3), p2, p1);
    const mdyIso = toIsoIfValid(toFullYear(p3), p1, p2);
    const ymdIso = toIsoIfValid(toFullYear(p1), p2, p3);
    const validCandidates = [
      { iso: ymdIso }, // yy/M/d
      { iso: dmyIso }, // d/M/yy
      { iso: mdyIso }, // M/d/yy
    ]
      .filter((candidate): candidate is { iso: string } => Boolean(candidate.iso))
      .map((candidate) => ({
        iso: candidate.iso,
        parsedAt: new Date(`${candidate.iso}T00:00:00.000Z`).getTime(),
      }));

    if (validCandidates.length > 1) {
      const anchorHints = globalThis as {
        __SMART_PASTE_SMS_RECEIVED_AT__?: string;
        __SMART_PASTE_TX_CREATED_AT__?: string;
      };
      const injectedAnchor =
        anchorHints.__SMART_PASTE_SMS_RECEIVED_AT__ ||
        anchorHints.__SMART_PASTE_TX_CREATED_AT__;
      const fallbackAnchor = new Date();
      const contextAnchor = toAnchorDate(context?.anchorDate);
      const injectedAnchorDate = toAnchorDate(injectedAnchor);
      const anchorTime = (contextAnchor || injectedAnchorDate || fallbackAnchor).getTime();
      const plausibilityWindow = getPlausibilityWindowDays(resolvePlausibilityProfile(context));

      let bestCandidate: string | undefined;
      let bestScore = Number.NEGATIVE_INFINITY;

      validCandidates.forEach(({ iso, parsedAt }) => {
        const diffDays = Math.abs(parsedAt - anchorTime) / (24 * 60 * 60 * 1000);
        const isFuture = parsedAt > anchorTime;
        const ageDays = (anchorTime - parsedAt) / (24 * 60 * 60 * 1000);

        let score = -diffDays;
        if (ageDays > plausibilityWindow.past) score -= 150;
        if (ageDays > plausibilityWindow.past * 2) score -= 250;
        if (isFuture) score -= 120;
        if (isFuture && diffDays > plausibilityWindow.future) score -= 300;

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = iso;
        }
      });

      if (bestCandidate) return bestCandidate;
    }

    if (dmyIso) return dmyIso;
  }

  // Match short DD-MM-YY or D-M-YY dash formats like 25-3-26
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
  if (dashMatch) {
    const [, dd, mm, yy] = dashMatch;
    const fullYear = parseInt(yy, 10) < 50 ? 2000 + parseInt(yy, 10) : 1900 + parseInt(yy, 10);
    return toIsoIfValid(fullYear, parseInt(mm, 10), parseInt(dd, 10));
  }

  // Match short DD/MM/YY or D/M/YY slash formats like 11/3/26
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (slashMatch) {
    const [, dd, mm, yy] = slashMatch;
    const fullYear = parseInt(yy, 10) < 50 ? 2000 + parseInt(yy, 10) : 1900 + parseInt(yy, 10);
    return toIsoIfValid(fullYear, parseInt(mm, 10), parseInt(dd, 10));
  }

  // Fallback to native parsing (safe for ISO and full-year formats)
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString().split('T')[0];
}


export interface ParsedField {
  value: string
  confidenceScore: number
  source: 'direct' | 'inferred' | 'default'
}

type AccountInferenceSource =
  | 'direct-field'
  | 'token-remap'
  | 'template-hash-map'
  | 'template-default'
  | 'senderHint-fallback'
  | 'empty';


function applyFromAccountRemapping(accountToken?: string): string | undefined {
  if (!accountToken) return undefined;
  const map = JSON.parse(safeStorage.getItem('xpensia_fromaccount_map') || '{}');
  const mapped = map[accountToken];
  if (typeof mapped !== 'string') return undefined;
  const normalized = mapped.trim();
  return normalized || undefined;
}

type TemplateAccountMapEntry = {
  accountId: string;
  updatedAt: number;
  count: number;
};

type TemplateAccountMap = Record<string, TemplateAccountMapEntry>;

const TEMPLATE_ACCOUNT_MAP_KEY = 'xpensia_template_account_map';

const isAccountInferenceDebugEnabled =
  import.meta.env.VITE_DEBUG_ACCOUNT_INFERENCE === 'true';

const getTemplateAccountMapKey = (
  templateHash: string,
  role: 'from' | 'to',
): string => `${templateHash}::${role}`;

const loadTemplateAccountMap = (): TemplateAccountMap => {
  try {
    return JSON.parse(safeStorage.getItem(TEMPLATE_ACCOUNT_MAP_KEY) || '{}');
  } catch {
    return {};
  }
};

/**
 * Parse an SMS message into structured fields with confidence scores.
 *
 * @param rawMessage - Raw SMS text payload
 * @param senderHint - Optional sender identifier used for template lookup
 * @returns Parsed structure, direct fields, inferred fields, and defaults
 *
 * @review-focus
 * - Throws if template extraction fails
 * - Returns empty parse object for empty messages
 */
export interface ParsedSmsResult {
  rawMessage: string;
  template: string;
  templateHash: string;
  matched: boolean;
  directFields: Record<string, ParsedField>;
  inferredFields: Record<string, ParsedField>;
  defaultValues: Record<string, ParsedField>;
  accountInference?: {
    templateHashAccountMapHit: boolean;
    fromAccountSource: AccountInferenceSource;
    toAccountSource: AccountInferenceSource;
  };
  candidates: {
    accountCandidates: string[];
  };
  inferenceDebug?: Record<string, FieldInferenceDebug>;
}

export function parseSmsMessage(rawMessage: string, senderHint?: string, debugTrace?: InferenceDecisionTrace, context?: ParseContext): ParsedSmsResult {
  const timer = new ParserTraceTimer();
  // ============================================================================
  // SECTION: Input Guardrails
  // PURPOSE: Handle empty messages without throwing
  // REVIEW: Callers should treat empty parse as non-transactional
  // ============================================================================
  if (import.meta.env.MODE === 'development') {
    // console.log('[SmartPaste] Step 1: Received raw message:', rawMessage);
  }
  
  // Return empty parse result instead of throwing for empty messages
  if (!rawMessage) {
    return {
      rawMessage: '',
      template: '',
      templateHash: '',
      matched: false,
      directFields: {},
      inferredFields: {},
      defaultValues: {},
      candidates: { accountCandidates: [] },
    };
  }
  
  // ============================================================================
  // SECTION: Template Extraction
  // PURPOSE: Build a template structure and placeholders from raw SMS text
  // REVIEW: Extraction errors should be surfaced to caller
  // ============================================================================

  let structure = '';
  let placeholders: Record<string, string> = {};
  let templateHash = '';
  try {
    timer.start('template_extraction');
    const result = extractTemplateStructure(rawMessage);
    structure = result.structure;
    placeholders = result.placeholders;
    templateHash = result.hash;
    timer.end('template_extraction', debugTrace);

    if (!structure) throw new Error('Extracted template is empty');
    if (!placeholders) throw new Error('Extracted placeholders are missing');
	
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('[SmartPaste] ❌ extractTemplateStructure failed:', err);
    }
    throw err; // Let upstream handler deal with it
  }

  if (import.meta.env.MODE === 'development') {
    // console.log('[SmartPaste] Step 2: Extracted Template:', structure);
  }
  if (import.meta.env.MODE === 'development') {
    // console.log('[SmartPaste] Step 3: Template Hash:', templateHash);
  }

  // ============================================================================
  // SECTION: Template Matching + Direct Field Extraction
  // PURPOSE: Hydrate direct fields using matched template defaults
  // REVIEW: Missing placeholders should be logged in development
  // ============================================================================

  timer.start('template_exact_lookup');
  const matchedTemplate = getTemplateByHash(
    templateHash,
    senderHint,
    (placeholders as Record<string, string>).account
  );
  timer.end('template_exact_lookup', debugTrace);
  if (debugTrace) {
    const operational = ensureOperationalTrace(debugTrace);
    operational.counters!.localMapsConsulted!.templateBank = true;
  }
  const directFields: Record<string, ParsedField> = {};
  const defaultValues: Record<string, ParsedField> = {};
  const templateDefaults: Record<string, string> = {};
  let fromAccountSource: AccountInferenceSource = 'empty';
  let toAccountSource: AccountInferenceSource = 'empty';

  if (matchedTemplate) {
    timer.start('direct_extraction');
    matchedTemplate.fields.forEach((field) => {
      const value = placeholders[field];
      if (value) {
        directFields[field] = {
          value,
          confidenceScore: computeConfidenceScore('direct'),
          source: 'direct',
        };
      } else {
        if (import.meta.env.MODE === 'development') {
          console.warn(`[SmartPaste] Missing placeholder value for ${field}`);
        }
      }
    });

    if (matchedTemplate.defaultValues) {
      Object.entries(matchedTemplate.defaultValues).forEach(([key, value]) => {
        templateDefaults[key] = value;

        if (key === 'fromAccount' || key === 'toAccount') {
          return;
        }

        if (!directFields[key]) {
          const field = {
            value,
            confidenceScore: computeConfidenceScore('default'),
            source: 'default' as const,
          };
          directFields[key] = field;
          defaultValues[key] = field;
        }
      });
    }
    timer.end('direct_extraction', debugTrace);
  } else {
    timer.start('direct_extraction');
    // ✅ FIRST-TIME message – use raw extracted values
    Object.entries(placeholders).forEach(([key, value]) => {
      directFields[key] = {
        value,
        confidenceScore: computeConfidenceScore('direct'),
        source: 'direct',
      };
    });
    timer.end('direct_extraction', debugTrace);
  }

  if (directFields['vendor']) {
    if (debugTrace) {
      const operational = ensureOperationalTrace(debugTrace);
      operational.counters!.localMapsConsulted!.vendorMap = true;
    }
    directFields['vendor'].value = applyVendorMapping(directFields['vendor'].value);
  }

  // Normalize known field names like 'date'
  if (directFields['date']) {
    timer.start('normalize');
    const normalized = normalizeDate(directFields['date'].value, context);
    if (normalized) {
      directFields['date'].value = normalized;
      if (import.meta.env.MODE === 'development') {
        // console.log('[SmartPaste] Normalized date:', directFields['date'].value);
      }
    }
    timer.end('normalize', debugTrace);
  }

  // Promote learned account remapping for exact account tokens when available.
  // This lets repeated patterns auto-drive fromAccount even if sender context changes.
  if (directFields['fromAccount']) {
    fromAccountSource = 'direct-field';
  }
  if (directFields['toAccount']) {
    toAccountSource = 'direct-field';
  }

  if (!directFields['fromAccount'] && directFields['account']) {
    const mappedFromAccount = applyFromAccountRemapping(directFields['account'].value);
    if (mappedFromAccount) {
      const field = {
        value: mappedFromAccount,
        confidenceScore: computeConfidenceScore('default'),
        source: 'default' as const,
      };
      directFields['fromAccount'] = field;
      defaultValues['fromAccount'] = field;
      fromAccountSource = 'token-remap';
    }
  }

  const preferredFromAccount = getPreferredFromAccount(senderHint, templateHash);
  const hasStrongDirectAccountToken =
    Boolean(directFields['account']) &&
    (directFields['account']?.confidenceScore || 0) >= computeConfidenceScore('direct');

  if (
    !directFields['fromAccount'] &&
    !defaultValues['fromAccount'] &&
    preferredFromAccount &&
    !hasStrongDirectAccountToken
  ) {
    const field = {
      value: preferredFromAccount,
      confidenceScore: computeConfidenceScore('default'),
      source: 'default' as const,
    };
    directFields['fromAccount'] = field;
    defaultValues['fromAccount'] = field;
    fromAccountSource = 'template-hash-map';
  }

  const templateAccountMap = loadTemplateAccountMap();
  if (debugTrace) {
    const operational = ensureOperationalTrace(debugTrace);
    operational.counters!.localMapsConsulted!.templateAccountMap = true;
  }
  const templateFromAccount =
    templateAccountMap[getTemplateAccountMapKey(templateHash, 'from')]?.accountId;
  const templateToAccount =
    templateAccountMap[getTemplateAccountMapKey(templateHash, 'to')]?.accountId;

  if (!directFields['fromAccount'] && !defaultValues['fromAccount'] && templateFromAccount) {
    const field = {
      value: templateFromAccount,
      confidenceScore: computeConfidenceScore('default'),
      source: 'default' as const,
    };
    directFields['fromAccount'] = field;
    defaultValues['fromAccount'] = field;
    fromAccountSource = 'template-hash-map';
  }

  if (!directFields['toAccount'] && !defaultValues['toAccount'] && templateToAccount) {
    const field = {
      value: templateToAccount,
      confidenceScore: computeConfidenceScore('default'),
      source: 'default' as const,
    };
    directFields['toAccount'] = field;
    defaultValues['toAccount'] = field;
    toAccountSource = 'template-hash-map';
  }

  if (!directFields['fromAccount'] && !defaultValues['fromAccount'] && templateDefaults.fromAccount) {
    const field = {
      value: templateDefaults.fromAccount,
      confidenceScore: computeConfidenceScore('default'),
      source: 'default' as const,
    };
    directFields['fromAccount'] = field;
    defaultValues['fromAccount'] = field;
    fromAccountSource = 'template-default';
  }

  if (!directFields['toAccount'] && !defaultValues['toAccount'] && templateDefaults.toAccount) {
    const field = {
      value: templateDefaults.toAccount,
      confidenceScore: computeConfidenceScore('default'),
      source: 'default' as const,
    };
    directFields['toAccount'] = field;
    defaultValues['toAccount'] = field;
    toAccountSource = 'template-default';
  }

  if (isAccountInferenceDebugEnabled) {
    console.log('[AccountInference]', {
      templateHash,
      templateHashAccountMapHit: Boolean(templateFromAccount || templateToAccount),
      chosenFromAccountSource: fromAccountSource,
      chosenToAccountSource: toAccountSource,
      fromAccount: directFields['fromAccount']?.value,
      toAccount: directFields['toAccount']?.value,
    });
  }

  const accountCandidatesV1Enabled =
    import.meta.env.VITE_ACCOUNT_CANDIDATES_V1 === 'true';

  const inferredAccountCandidates = accountCandidatesV1Enabled
    ? extractAccountInferenceCandidates(rawMessage, senderHint)
    : [];
  const bestAccountCandidate = accountCandidatesV1Enabled
    ? pickBestAccountCandidate(inferredAccountCandidates, {
        senderHint,
        rawMessage,
      })
    : undefined;

  // ============================================================================
  // SECTION: Normalization + Inference
  // PURPOSE: Normalize known fields and infer missing data
  // REVIEW: Inference should not overwrite direct fields
  // ============================================================================

  const rawDirects: Record<string, string> = {};
  Object.entries(directFields).forEach(([k, v]) => (rawDirects[k] = v.value));

  const { inferred: inferredRaw, debugByField } = inferIndirectFieldsWithDebug(rawMessage, rawDirects, debugTrace);
  const inferred: Record<string, ParsedField> = {};
  Object.entries(inferredRaw).forEach(([key, value]) => {
    if (!directFields[key]) {
      inferred[key] = {
        value,
        confidenceScore: computeConfidenceScore('inferred'),
        source: 'inferred',
      };
    }
  });

  // Keep legacy extraction as primary; only inject candidate-based account when nothing else resolved.
  if (
    accountCandidatesV1Enabled &&
    bestAccountCandidate &&
    !directFields['account'] &&
    !directFields['fromAccount'] &&
    !defaultValues['fromAccount'] &&
    !inferred['fromAccount']
  ) {
    inferred['fromAccount'] = {
      value: bestAccountCandidate.value,
      confidenceScore: computeConfidenceScore('inferred'),
      source: 'inferred',
    };
  }
  if (import.meta.env.MODE === 'development') {
    // console.log('[SmartPaste] Step 5: Inferred fields:', inferred);
  }
  if (import.meta.env.MODE === 'development') {
    // console.log('[SmartPaste] Final directFields:', directFields);
  }

  // ============================================================================
  // SECTION: Output Assembly
  // PURPOSE: Return parsed fields with metadata for downstream processing
  // REVIEW: directFields and inferredFields should be disjoint
  // ============================================================================

  return {
    rawMessage,
    template: structure,
    templateHash,
    matched: !!matchedTemplate,
    directFields,
    inferredFields: inferred,
    defaultValues,
    accountInference: {
      templateHashAccountMapHit: Boolean(templateFromAccount || templateToAccount),
      fromAccountSource,
      toAccountSource,
    },
    candidates: {
      accountCandidates: extractLegacyAccountCandidates(rawMessage).candidates.map(c => typeof c === 'string' ? c : c.value),
    },
    inferenceDebug: debugByField,
  };
}



function applyVendorMapping(vendor: string): string {
  const map = JSON.parse(safeStorage.getItem('xpensia_vendor_map') || '{}');
  const normalizedVendor = normalizeVendorNameForCompare(vendor || '');
  return map[normalizedVendor] || map[vendor] || vendor;
}
