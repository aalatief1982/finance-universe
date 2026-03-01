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

interface KeywordScoreContext {
  sourceText: string;
  vendorText?: string;
  keyword: string;
  lastUpdated?: string;
  frequency?: number;
}

interface ScoredCandidate {
  keyword: string;
  source: 'vendor' | 'message';
  matchType: 'exact' | 'substring';
  keywordLength: number;
  timestampScore: number;
  frequencyScore: number;
  score: number;
}

const KEYWORD_DEBUG_ENABLED = String(import.meta.env.VITE_DEBUG_KEYWORD_SCORING).toLowerCase() === 'true';

const getKeywordMatchType = (sourceText: string, keyword: string): 'exact' | 'substring' | null => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return null;
  const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactPhrasePattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapedKeyword}([^\\p{L}\\p{N}]|$)`, 'iu');
  if (exactPhrasePattern.test(sourceText)) {
    return 'exact';
  }
  return sourceText.toLowerCase().includes(normalizedKeyword) ? 'substring' : null;
};

export function scoreKeywordMatch({
  sourceText,
  vendorText,
  keyword,
  lastUpdated,
  frequency,
}: KeywordScoreContext): ScoredCandidate | null {
  const matchType = getKeywordMatchType(sourceText, keyword);
  if (!matchType) return null;

  const normalizedKeyword = keyword.trim().toLowerCase();
  const vendorMatchType = vendorText ? getKeywordMatchType(vendorText, keyword) : null;
  const source: 'vendor' | 'message' = vendorMatchType ? 'vendor' : 'message';
  const timestampScore = lastUpdated ? new Date(lastUpdated).getTime() || 0 : 0;
  const frequencyScore = Number.isFinite(frequency) ? Number(frequency) : 0;

  const score =
    (matchType === 'exact' ? 1_000_000 : 500_000) +
    (source === 'vendor' ? 100_000 : 0) +
    normalizedKeyword.length * 1_000 +
    Math.max(0, timestampScore) +
    Math.max(0, frequencyScore);

  return {
    keyword: normalizedKeyword,
    source,
    matchType,
    keywordLength: normalizedKeyword.length,
    timestampScore,
    frequencyScore,
    score,
  };
}

const pickBestCandidate = <T extends ScoredCandidate>(candidates: T[]): T | null => {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => {
    if (b.matchType !== a.matchType) return a.matchType === 'exact' ? -1 : 1;
    if (b.source !== a.source) return a.source === 'vendor' ? -1 : 1;
    if (b.keywordLength !== a.keywordLength) return b.keywordLength - a.keywordLength;
    if (b.timestampScore !== a.timestampScore) return b.timestampScore - a.timestampScore;
    if (b.frequencyScore !== a.frequencyScore) return b.frequencyScore - a.frequencyScore;
    if (b.score !== a.score) return b.score - a.score;
    return a.keyword.localeCompare(b.keyword);
  })[0];
};

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

  // Step 2: Deterministic substring scoring
  const substringCandidates = vendorKeys
    .map((key) => {
      const score = scoreKeywordMatch({
        sourceText: lowerInput,
        vendorText: lowerInput,
        keyword: softNormalize(key),
      });

      if (!score) return null;
      return {
        ...score,
        keyword: key,
      };
    })
    .filter((candidate): candidate is ScoredCandidate & { keyword: string } => Boolean(candidate));

  const bestSubstringCandidate = pickBestCandidate(substringCandidates);
  if (bestSubstringCandidate) {
    const data = fallbackVendors[bestSubstringCandidate.keyword];
    console.info('[SmartPaste] Substring matched vendor:', bestSubstringCandidate.keyword, '→', data);
    if (KEYWORD_DEBUG_ENABLED) {
      console.debug('[SmartPaste][KeywordScoring] Vendor fallback candidates:', substringCandidates);
      console.debug('[SmartPaste][KeywordScoring] Vendor fallback winner:', bestSubstringCandidate);
    }
    return { vendor: bestSubstringCandidate.keyword, ...data };
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
  const messageText = text.toLowerCase();
  const vendorText = (knowns.vendor || '').toLowerCase();
  const rawText = `${messageText} ${vendorText}`.trim();
  const inferred: Record<string, string> = {};

  // Step 1: Load keyword bank
  const keywordBank: KeywordMapping[] = JSON.parse(safeStorage.getItem('xpensia_keyword_bank') || '[]') || [];
  if (!Array.isArray(keywordBank)) {
    if (import.meta.env.MODE === 'development') {
      console.error('[SmartPaste] Invalid keyword bank format:', keywordBank);
    }
  }

  // Step 2: Keyword-based mapping
  type FieldCandidate = ScoredCandidate & { field: string; value: string };
  const candidatesByField = new Map<string, FieldCandidate[]>();

  keywordBank.forEach((entry: KeywordMapping & Partial<KeywordEntry>) => {
    const score = scoreKeywordMatch({
      sourceText: rawText,
      vendorText,
      keyword: entry.keyword,
      lastUpdated: entry.lastUpdated,
      frequency: entry.mappingCount,
    });

    if (!score) return;

    entry.mappings.forEach(({ field, value }) => {
      if (!value || typeof value !== 'string' || knowns[field]) return;
      const fieldCandidates = candidatesByField.get(field) || [];
      fieldCandidates.push({
        ...score,
        field,
        value: value.trim(),
      });
      candidatesByField.set(field, fieldCandidates);
    });
  });

  candidatesByField.forEach((fieldCandidates, field) => {
    const winner = pickBestCandidate(fieldCandidates);
    if (!winner || inferred[field]) return;
    inferred[field] = winner.value;
    if (KEYWORD_DEBUG_ENABLED) {
      console.debug(`[SmartPaste][KeywordScoring] Keyword candidates for ${field}:`, fieldCandidates);
      console.debug(`[SmartPaste][KeywordScoring] Keyword winner for ${field}:`, winner);
    }
  });

  // Step 3: Type keyword inference
  if (!inferred['type']) {
    const typeKeywordsData = JSON.parse(safeStorage.getItem('xpensia_type_keywords') || '{}');
    const typeCandidates: Array<ScoredCandidate & { transactionType: string }> = [];
    
    // Handle object format: {expense: [...], income: [...], transfer: [...]}
    for (const [transactionType, keywords] of Object.entries(typeKeywordsData)) {
      if (Array.isArray(keywords)) {
        for (const keyword of keywords) {
          const candidate = scoreKeywordMatch({
            sourceText: rawText,
            vendorText,
            keyword,
          });
          if (candidate) {
            typeCandidates.push({ ...candidate, transactionType });
          }
        }
      }
    }

    const winner = pickBestCandidate(typeCandidates);
    if (winner) {
      inferred['type'] = winner.transactionType;
      if (KEYWORD_DEBUG_ENABLED) {
        console.debug('[SmartPaste][KeywordScoring] Type candidates:', typeCandidates);
        console.debug('[SmartPaste][KeywordScoring] Type winner:', winner);
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
  const normalizedMessage = message
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF\u061C]/g, '');

  const captureCandidate = (value: string): string => {
    const candidate = value.trim().replace(/\s+on\s+\d{4}(-\d{2}(-\d{2})?)?.*$/i, '');

    const isValidVendor =
      candidate.length > 2 &&
      isNaN(Number(candidate)) &&
      !/^\d{4}$/.test(candidate) &&
      !candidate.toLowerCase().includes('sar') &&
      !candidate.match(/^\*{2,}/) &&
      !candidate.match(/^\d+(?:[.,]\d+)?$/);

    return isValidVendor ? candidate : '';
  };

  const explicitLabel = normalizedMessage.match(
    /(?:^|[\s\n])(?:لدى|merchant|vendor)\s*[:：]\s*([^\n,؛;]+)/i,
  );
  if (explicitLabel?.[1]) {
    const explicitCandidate = captureCandidate(explicitLabel[1]);
    if (explicitCandidate) return explicitCandidate;
  }

  const anchorPatterns = [
    /(?:^|[\s\n])(?:من\s+عند|تم\s+الدفع\s+لـ|تم\s+الشراء\s+من|لدى|من|عند)\s*[:\s]\s*([^\n]+?)(?=\s+(?:بمبلغ|بقيمة|مبلغ|بسعر|في|تاريخ|الرسوم)(?:\s|$)|[\n,،؛;:.!؟?-]|$)/i,
    /(?:\b)(?:at|from|paid to|purchased from)\s*[:\s]*([^\n,؛;:-]+)/i,
  ];

  for (const pattern of anchorPatterns) {
    const match = normalizedMessage.match(pattern);
    if (match?.[1]) {
      const candidate = captureCandidate(match[1]);
      if (candidate) return candidate;
    }
  }

  const domainLike = normalizedMessage.match(
    /(?:^|[\s\n:،؛;,])([a-z0-9][a-z0-9.-]*\.[a-z]{2,})(?=$|[\s\n،؛;,])/i,
  );
  if (domainLike?.[1]) {
    return domainLike[1].toLowerCase();
  }

  // Fallback logic for salary transfers
  const lowerText = normalizedMessage.toLowerCase();
  if (lowerText.includes('راتب') || lowerText.includes('salary')) {
    return 'Company';
  }

  if (import.meta.env.MODE === 'development') {
    console.warn('[extractVendorName] No valid vendor found for message:', message);
  }
  return '';
}
