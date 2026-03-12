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
//import { normalizeDate } from './dateUtils';



/**
 * Normalize a date string into ISO (yyyy-MM-dd) format when possible.
 *
 * @review-focus
 * - Handles short yy-mm-dd variants safely
 * - Falls back to Date parsing when format is unknown
 */
/**
 * Expand a 2-digit year: <50 → 20xx, >=50 → 19xx
 */
function expandYear(yy: number): number {
  return yy < 50 ? 2000 + yy : 1900 + yy;
}

/**
 * Check if a date triplet (year, month, day) forms a valid calendar date.
 */
function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Score a candidate date by proximity to an anchor.
 * Lower score = better. Heavily penalizes dates >1yr in the past or >7d in the future.
 */
function scoreCandidate(candidateIso: string, anchorMs: number): number {
  const candidateMs = new Date(candidateIso).getTime();
  const diffDays = (candidateMs - anchorMs) / (1000 * 60 * 60 * 24);

  // Future dates beyond 7 days: heavily penalized
  if (diffDays > 7) return 1e9 + diffDays;
  // Past dates beyond ~400 days: heavily penalized
  if (diffDays < -400) return 1e8 + Math.abs(diffDays);
  // Otherwise: absolute distance in days
  return Math.abs(diffDays);
}

/**
 * Normalize a date string into ISO (yyyy-MM-dd) format.
 * For ambiguous short-numeric dates (A/B/C or A-B-C where one part is 2-digit year),
 * generates multiple candidates and picks the closest to anchorDate.
 *
 * @param dateStr - raw date string
 * @param anchorDate - reference timestamp in ms (default: Date.now())
 */
export function normalizeDate(dateStr: string, anchorDate?: number): string | undefined {
  if (!dateStr) return undefined;

  const anchor = anchorDate ?? Date.now();
  const sep = dateStr.includes('/') ? '/' : dateStr.includes('-') ? '-' : null;

  // Match A<sep>B<sep>C where all parts are 1-2 digits (ambiguous short date)
  const shortMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (shortMatch && sep) {
    const [a, b, c] = [parseInt(shortMatch[1], 10), parseInt(shortMatch[2], 10), parseInt(shortMatch[3], 10)];

    const candidates: { iso: string; score: number }[] = [];

    // Candidate 1: DD/MM/YY
    const y1 = expandYear(c);
    if (isValidDate(y1, b, a)) {
      const iso = `${y1}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
      candidates.push({ iso, score: scoreCandidate(iso, anchor) });
    }

    // Candidate 2: YY/M/DD
    const y2 = expandYear(a);
    if (isValidDate(y2, b, c)) {
      const iso = `${y2}-${String(b).padStart(2, '0')}-${String(c).padStart(2, '0')}`;
      candidates.push({ iso, score: scoreCandidate(iso, anchor) });
    }

    // Candidate 3: MM/DD/YY
    const y3 = expandYear(c);
    if (isValidDate(y3, a, b)) {
      const iso = `${y3}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
      candidates.push({ iso, score: scoreCandidate(iso, anchor) });
    }

    if (candidates.length > 0) {
      candidates.sort((x, y) => x.score - y.score);
      if (import.meta.env.MODE === 'development' && candidates.length > 1) {
        console.log('[normalizeDate] Ambiguous date candidates:', dateStr, candidates);
      }
      return candidates[0].iso;
    }
  }

  // Match A<sep>B<sep>C where C is 4-digit year (unambiguous DD/MM/YYYY)
  const longMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (longMatch) {
    const [, dd, mm, yyyy] = longMatch;
    const y = parseInt(yyyy, 10), m = parseInt(mm, 10), d = parseInt(dd, 10);
    if (isValidDate(y, m, d)) {
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
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

export function parseSmsMessage(rawMessage: string, senderHint?: string, debugTrace?: InferenceDecisionTrace): ParsedSmsResult {
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
    const normalized = normalizeDate(directFields['date'].value);
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
