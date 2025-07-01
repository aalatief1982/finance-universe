// structureParser.ts

/**
 * Parses a raw SMS using structure-template-first approach.
 * Matches existing templates or builds new ones; returns structured transaction data.
 */

import { extractTemplateStructure, getTemplateByHash } from './templateUtils';
import { inferIndirectFields } from './suggestionEngine';
import { computeConfidenceScore } from './confidenceUtils';
import { normalizeTemplateStructure } from './templateNormalizer';
import { sha256 } from './sha256';
//import { normalizeDate } from './dateUtils';

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

export function parseSmsMessage(rawMessage: string, senderHint?: string) {
  console.log('[SmartPaste] Step 1: Received raw message:', rawMessage);
        if (!rawMessage) {
    throw new Error('Empty message passed to extractTemplateStructure');
  }
  let template = '';
  let placeholders = {};
  try {
    const result = extractTemplateStructure(rawMessage);
    template = result.template;
    placeholders = result.placeholders;

        if (!template) throw new Error('Extracted template is empty');
        if (!placeholders) throw new Error('Extracted placeholders are missing');

  } catch (err) {
    console.error('[SmartPaste] ❌ extractTemplateStructure failed:', err);
    throw err; // Let upstream handler deal with it
  }

  const normalized = result.normalized || normalizeTemplateStructure(template);
  const templateHash = sha256(normalized);
  const structure = {
    structure: normalized,
    hash: templateHash,
    version: 'v2',
    hashAlgorithm: 'SHA256'
  };
  console.log('[SmartPaste] Step 2: Extracted Template:', template);
  console.log('[SmartPaste] Step 3: Template Hash:', templateHash);

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
        console.warn(`[SmartPaste] Missing placeholder value for ${field}`);
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
    console.log('[SmartPaste] Normalized date:', directFields['date'].value);
  }
}

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
  console.log('[SmartPaste] Step 5: Inferred fields:', inferred);
  console.log('[SmartPaste] Final directFields:', directFields);

  return {
    rawMessage,
    template,
    structure,
    matched: !!matchedTemplate,
    directFields,
    inferredFields: inferred,
    defaultValues,
  };
}

function applyVendorMapping(vendor: string): string {
  const map = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] || vendor;
}
