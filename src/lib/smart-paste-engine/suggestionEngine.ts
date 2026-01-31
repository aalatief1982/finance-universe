/**
 * @file suggestionEngine.ts
 * @description Indirect field inference engine for Smart Paste.
 *              Uses keyword banks and vendor fallbacks to suggest category/type.
 *
 * @responsibilities
 * - Keyword-based field inference (category, subcategory, type)
 * - Vendor name extraction from raw SMS text
 * - Fuzzy vendor matching using string-similarity
 * - Fallback category assignment for income transactions
 *
 * @storage-keys
 * - xpensia_keyword_bank: Keyword-to-field mappings
 * - xpensia_type_keywords: Transaction type keyword lists
 * - xpensia_vendor_fallbacks: Vendor-to-category mappings
 *
 * @dependencies
 * - string-similarity: Fuzzy matching library
 * - vendorFallbackUtils.ts: Vendor fallback data access
 *
 * @review-checklist
 * - [ ] Empty vendor name guard prevents string-similarity crash
 * - [ ] Type keyword lookup handles object format correctly
 * - [ ] Income fallback applies only when no other category found
 *
 * @review-tags
 * - @review-risk: extractVendorName regex (lines 319-349)
 * - @review-risk: findClosestFallbackMatch empty string guard (line 92)
 * - @performance: fuzzy matching runs on full vendor list
 */

import { safeStorage } from "@/utils/safe-storage";

import stringSimilarity from 'string-similarity';
import {
  loadVendorFallbacks,
  VendorFallbackData,
} from './vendorFallbackUtils';

const BANK_KEY = 'xpensia_keyword_bank';

// ============================================================================
// SECTION: Type Definitions
// PURPOSE: Define keyword mapping structures for inference
// ============================================================================

export interface KeywordMapping {
  keyword: string;
  mappings: {
    field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor';
    value: string;
  }[];
}

export interface KeywordEntry {
  keyword: string
  type: string
  lastUpdated?: string
  mappingCount?: number
  senderContext?: string
  transactionTypeContext?: string
}

/**
 * Find keyword entries matching a search term.
 * Sorted by usage count for relevance.
 */
export function getKeywordMatches(keyword: string): KeywordEntry[] {
  const raw = safeStorage.getItem(BANK_KEY)
  const bank: KeywordEntry[] = raw ? JSON.parse(raw) : []
  const lower = keyword.toLowerCase()
  return bank
    .filter(e => e.keyword.toLowerCase().includes(lower))
    .sort((a, b) => (b.mappingCount || 0) - (a.mappingCount || 0))
}

// ============================================================================
// SECTION: Vendor Fallback Matching
// PURPOSE: Fuzzy match vendor names to known category mappings
// REVIEW: Guard against empty strings to prevent library crash
// @review-risk: string-similarity throws on empty input
// ============================================================================

interface FallbackVendorEntry extends VendorFallbackData {
  vendor: string;
}

const getFallbackVendors = (): Record<string, VendorFallbackData> => {
  return loadVendorFallbacks();
};

/**
 * Normalize vendor string for fuzzy matching.
 * Removes zero-width characters and normalizes Unicode.
 */
function softNormalize(str: string): string {
  return str
    .normalize('NFC') // Canonical form, avoids multi-representation issues
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .toLowerCase();
}

/**
 * Find the closest matching vendor from the fallback bank.
 * Uses fuzzy string matching with 70% similarity threshold.
 * 
 * @param vendorName - Extracted vendor name from SMS
 * @returns Matched vendor data or null
 * 
 * @review-focus
 * - Guard clause at line 92 prevents crash on empty vendorName
 * - Fuzzy match threshold is 0.7 (70% similarity)
 * - Falls back to substring match if fuzzy fails
 */
export function findClosestFallbackMatch(vendorName: string): FallbackVendorEntry | null {
  const lowerInput = softNormalize(vendorName);
  
  // CRITICAL GUARD: Prevent crash when vendor name is empty or whitespace-only
  // string-similarity throws "Bad arguments" on empty strings
  if (!lowerInput) {
    return null;
  }
  
  const fallbackVendors = getFallbackVendors();
  const vendorKeys = Object.keys(fallbackVendors);

  // Guard: prevent crash when vendor list is empty
  if (vendorKeys.length === 0) {
    return null;
  }

  // Step 1: Try full fuzzy match
  const match = stringSimilarity.findBestMatch(lowerInput, vendorKeys.map(softNormalize));
  const originalKeysMap = Object.fromEntries(
    vendorKeys.map(key => [softNormalize(key), key])
  );

  if (match.bestMatch.rating >= 0.7) {
    const normalizedKey = match.bestMatch.target;
    const originalKey = originalKeysMap[normalizedKey];
    const data = fallbackVendors[originalKey];
    console.info('[SmartPaste] Fuzzy matched vendor:', originalKey, '→', data);
    return { vendor: originalKey, ...data };
  }

  // Step 2: Try substring match
  for (const key of vendorKeys) {
    if (lowerInput.includes(softNormalize(key))) {
      const data = fallbackVendors[key];
      console.info('[SmartPaste] Substring matched vendor:', key, '→', data);
      return { vendor: key, ...data };
    }
  }

  if (import.meta.env.MODE === 'development') {
    console.warn('[SmartPaste] No fallback match found for vendor:', vendorName);
  }
  return null;
}

// ============================================================================
// SECTION: Indirect Field Inference
// PURPOSE: Infer category/subcategory/type from keywords and vendor
// REVIEW: Multi-step inference with priority ordering
// ============================================================================

/**
 * Infer indirect transaction fields from text and known values.
 * Uses a multi-step approach:
 * 1. Keyword bank lookup
 * 2. Type keyword detection
 * 3. Vendor-based category fallback
 * 4. Income default fallback (Earnings > Benefits)
 * 
 * @param text - Raw SMS text
 * @param knowns - Already-known field values
 * @returns Inferred field-value pairs
 * 
 * @review-focus
 * - Keyword bank is loaded fresh each call
 * - Type keywords handle object format {expense: [...], income: [...]}
 * - Income fallback applies only when category AND subcategory missing
 */
export function inferIndirectFields(
  text: string,
  knowns: Partial<Record<string, string>> = {}
): Record<string, string> {
  const rawText = (text + ' ' + (knowns.vendor || '')).toLowerCase();
  const inferred: Record<string, string> = {};

  // Step 1: Load keyword bank
  const keywordBank: KeywordMapping[] = JSON.parse(safeStorage.getItem('xpensia_keyword_bank') || '[]') || [];
  if (!Array.isArray(keywordBank)) {
    if (import.meta.env.MODE === 'development') {
      console.error('[SmartPaste] Invalid keyword bank format:', keywordBank);
    }
  }

  // Step 2: Keyword-based mapping
  keywordBank.forEach(({ keyword, mappings }) => {
    if (rawText.includes(keyword.toLowerCase())) {
      mappings.forEach(({ field, value }) => {
        if (!value || typeof value !== 'string') return;
        if (!inferred[field] && !knowns[field]) {
          inferred[field] = value.trim();
        }
      });
    }
  });

  // Step 3: Type keyword inference
  if (!inferred['type']) {
    const typeKeywordsData = JSON.parse(safeStorage.getItem('xpensia_type_keywords') || '{}');
    const rawTextLower = rawText.toLowerCase();
    
    // Handle object format: {expense: [...], income: [...], transfer: [...]}
    for (const [transactionType, keywords] of Object.entries(typeKeywordsData)) {
      if (Array.isArray(keywords)) {
        for (const keyword of keywords) {
          if (rawTextLower.includes(keyword.toLowerCase())) {
            inferred['type'] = transactionType;
            break;
          }
        }
        if (inferred['type']) break;
      }
    }
  }

  // Step 4: Fallback vendor-based matching (only if category/subcategory are missing)
  const needsCategory = !inferred['category'] && !knowns['category'];
  const needsSubcategory = !inferred['subcategory'] && !knowns['subcategory'];

  if (needsCategory || needsSubcategory) {
    const vendorText = knowns.vendor || extractVendorName(text);
    const fallback = findClosestFallbackMatch(vendorText);
    if (import.meta.env.MODE === 'development') {
      // console.log('[SmartPaste] Fallback vendorText used:', vendorText);
    }
    if (import.meta.env.MODE === 'development') {
      // console.log('[SmartPaste] Fallback result:', fallback);
    }

    const finalType = inferred['type'] || knowns['type'];

    if (fallback && (!finalType || fallback.type.toLowerCase() === finalType.toLowerCase())) {
      if (needsCategory) inferred['category'] = fallback.category;
      if (needsSubcategory) inferred['subcategory'] = fallback.subcategory;
    }

    // Step 5: Absolute fallback for income type
    // Only applies when both category AND subcategory are still missing
    if (finalType === 'income' && !inferred['category'] && !inferred['subcategory']) {
      inferred['category'] = 'Earnings';
      inferred['subcategory'] = 'Benefits';
      inferred['__fallbackTag'] = 'income_default';
      console.info('[SmartPaste] Applied income fallback: Earnings > Benefits');
    }
  }

  if (import.meta.env.MODE === 'development') {
    // console.log('[SmartPaste] Final inferred fields before return:', inferred);
  }
  return inferred;
}

// ============================================================================
// SECTION: Vendor Name Extraction
// PURPOSE: Extract vendor/merchant name from SMS text
// REVIEW: Regex handles Arabic and English prepositions
// @review-risk: Complex regex with Arabic text patterns
// ============================================================================

/**
 * Extract vendor name from SMS message text.
 * Handles Arabic (لدى، من، في) and English (at, from, paid to) prepositions.
 * 
 * @param message - Raw SMS text
 * @returns Extracted vendor name or empty string
 * 
 * @review-focus
 * - Strips trailing date patterns like "on 2024-01-02"
 * - Rejects numeric-only or currency-only matches
 * - Falls back to "Company" for salary keywords
 */
export function extractVendorName(message: string): string {
  const match = message.match(
    /(?:لدى|من|في|عند|من عند|تم الدفع لـ|تم الشراء من|at|from|paid to|purchased from)[:\s]*([^\n,؛;:\-]+)/i
  );

  if (match && match[1]) {
    // Strip trailing date patterns like "on 2024" or "on 2024-01-02"
    const candidate = match[1].trim().replace(/\s+on\s+\d{4}(-\d{2}(-\d{2})?)?.*$/i, '');

    const isValidVendor =
      candidate.length > 2 &&
      isNaN(Number(candidate)) &&
      !/^\d{4}$/.test(candidate) &&
      !candidate.toLowerCase().includes("sar") &&
      !candidate.match(/^\*{2,}/) &&
      !candidate.match(/^\d+(?:[.,]\d+)?$/);

    if (isValidVendor) return candidate;
  }

  // Fallback logic for salary transfers
  const lowerText = message.toLowerCase();
  if (lowerText.includes("راتب") || lowerText.includes("salary")) {
    return "Company";
  }

  if (import.meta.env.MODE === 'development') {
    console.warn("[extractVendorName] No valid vendor found for message:", message);
  }
  return "";
}
