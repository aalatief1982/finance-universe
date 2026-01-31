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
import { inferIndirectFields } from './suggestionEngine';
import { computeConfidenceScore } from './confidenceUtils';
//import { normalizeDate } from './dateUtils';



/**
 * Normalize a date string into ISO (yyyy-MM-dd) format when possible.
 *
 * @review-focus
 * - Handles short yy-mm-dd variants safely
 * - Falls back to Date parsing when format is unknown
 */
export function normalizeDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Match short yy-mm-dd or y-m-d formats like 25-3-26
  const match = dateStr.match(/^(\d{2})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const [_, yy, mm, dd] = match;
    const fullYear = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    const iso = new Date(`${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`).toISOString();
    return iso.split('T')[0]; // Only return yyyy-MM-dd
  }

  // Fallback to native parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString().split('T')[0];
}


export interface ParsedField {
  value: string
  confidenceScore: number
  source: 'direct' | 'inferred' | 'default'
}

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
export function parseSmsMessage(rawMessage: string, senderHint?: string) {
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
    const result = extractTemplateStructure(rawMessage);
    structure = result.structure;
    placeholders = result.placeholders;
    templateHash = result.hash;

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

  const matchedTemplate = getTemplateByHash(
    templateHash,
    senderHint,
    (placeholders as any).account
  );
  const directFields: Record<string, ParsedField> = {};
  const defaultValues: Record<string, ParsedField> = {};

  if (matchedTemplate) {
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
  } else {
    // ✅ FIRST-TIME message – use raw extracted values
    Object.entries(placeholders).forEach(([key, value]) => {
      directFields[key] = {
        value,
        confidenceScore: computeConfidenceScore('direct'),
        source: 'direct',
      };
    });
  }

  // Normalize known field names like 'date'
  if (directFields['date']) {
    const normalized = normalizeDate(directFields['date'].value);
    if (normalized) {
      directFields['date'].value = normalized;
      if (import.meta.env.MODE === 'development') {
        // console.log('[SmartPaste] Normalized date:', directFields['date'].value);
      }
    }
  }

  // ============================================================================
  // SECTION: Normalization + Inference
  // PURPOSE: Normalize known fields and infer missing data
  // REVIEW: Inference should not overwrite direct fields
  // ============================================================================

  const rawDirects: Record<string, string> = {};
  Object.entries(directFields).forEach(([k, v]) => (rawDirects[k] = v.value));

  const inferredRaw = inferIndirectFields(rawMessage, rawDirects);
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
  };
}



function applyVendorMapping(vendor: string): string {
  const map = JSON.parse(safeStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] || vendor;
}
