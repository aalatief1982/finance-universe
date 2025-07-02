/**
 * Suggests indirect transaction fields using keyword mappings.
 * Reads from localStorage['xpensia_keyword_bank'].
 */

import stringSimilarity from 'string-similarity';
import {
  loadVendorFallbacks,
  VendorFallbackData,
} from './vendorFallbackUtils';

const BANK_KEY = 'xpensia_keyword_bank';

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

export function getKeywordMatches(keyword: string): KeywordEntry[] {
  const raw = localStorage.getItem(BANK_KEY)
  const bank: KeywordEntry[] = raw ? JSON.parse(raw) : []
  const lower = keyword.toLowerCase()
  return bank
    .filter(e => e.keyword.toLowerCase().includes(lower))
    .sort((a, b) => (b.mappingCount || 0) - (a.mappingCount || 0))
}

interface FallbackVendorEntry extends VendorFallbackData {
  vendor: string;
}

const getFallbackVendors = (): Record<string, VendorFallbackData> => {
  return loadVendorFallbacks();
};


// Utility to normalize vendor names
const normalize = (str: string): string =>
  str.normalize('NFC').replace(/[\s\-_,×]+/g, '').toLowerCase();

/* export function findClosestFallbackMatch(vendorName: string): FallbackVendorEntry | null {
  const lowerInput = vendorName.toLowerCase();
  const vendorKeys = Object.keys(fallbackVendors);

  // Step 1: Try full fuzzy match
  const match = stringSimilarity.findBestMatch(lowerInput, vendorKeys);
  if (match.bestMatch.rating >= 0.7) {
    const key = match.bestMatch.target;
    const data = (fallbackVendors as Record<string, FallbackVendorEntry>)[key];
    return { vendor: key, ...data };
  }

  // Step 2: Try partial substring match (no fuzzy score needed)
  for (const key of vendorKeys) {
    if (lowerInput.includes(key)) {
      const data = (fallbackVendors as Record<string, FallbackVendorEntry>)[key];
      return { vendor: key, ...data };
    }
  }

  return null;
}
 */
 
 
 function softNormalize(str: string): string {
  return str
    .normalize('NFC') // Canonical form, avoids multi-representation issues
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .toLowerCase();
}



export function findClosestFallbackMatch(vendorName: string): FallbackVendorEntry | null {
  const lowerInput = softNormalize(vendorName);
  const fallbackVendors = getFallbackVendors();
  const vendorKeys = Object.keys(fallbackVendors);

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

  console.warn('[SmartPaste] No fallback match found for vendor:', vendorName);
  return null;
}

/* export function inferIndirectFields(
  text: string,
  knowns: Partial<Record<string, string>> = {}
): Record<string, string> {
  const rawText = (text + ' ' + (knowns.vendor || '')).toLowerCase();
  const inferred: Record<string, string> = {};

  // ⬇️ Load keyword bank
  const keywordBank: KeywordMapping[] = JSON.parse(localStorage.getItem(BANK_KEY) || '[]') || [];
  if (!Array.isArray(keywordBank)) {
    console.error('[ERROR] Invalid keyword bank data:', keywordBank);
  }

  console.log('[DEBUG] keywordBank:', keywordBank);
  console.log('[DEBUG] fallbackVendors:', getFallbackVendors());

  // ⬇️ Keyword-based inference
  keywordBank.forEach(({ keyword, mappings }) => {
    if (rawText.includes(keyword.toLowerCase())) {
      mappings.forEach(({ field, value }) => {
        if (typeof value !== 'string' || !value) {
          console.warn(`[KeywordMapping] Skipping invalid value for field "${field}":`, value);
          return;
        }
        if (!inferred[field] && !knowns[field]) {
          inferred[field] = value.trim();
        }
      });
    }
  });

  // ⬇️ Type keywords (fallback)
  if (!inferred['type']) {
    const typeKeywords = JSON.parse(localStorage.getItem('xpensia_type_keywords') || '[]');
    for (const entry of typeKeywords) {
      if (rawText.includes(entry.keyword.toLowerCase())) {
        inferred['type'] = entry.type;
        break;
      }
    }
  }

  // ⬇️ Fallback vendor inference if category/subcategory missing
  const needsCategoryFallback = ['category', 'subcategory'].some(f => !inferred[f] && !knowns[f]);
  if (needsCategoryFallback) {
	const vendorText = knowns.vendor || extractVendorName(text);
	const fallback = findClosestFallbackMatch(vendorText);
	console.log("Fallback vendorText used:", vendorText);
	console.log("Fallback result:", fallback);

	const finalType = inferred['type'] || knowns['type'];

	if (fallback && (!finalType || fallback.type === finalType)) {
	  if (!inferred['category'] && !knowns['category']) {
		inferred['category'] = fallback.category;
	  }
	  if (!inferred['subcategory'] && !knowns['subcategory']) {
		inferred['subcategory'] = fallback.subcategory;
	  }
	}

	// ✅ Special fallback for income if vendor fallback failed
	const stillMissingCategory = !inferred['category'] && !knowns['category'];
	const stillMissingSubcategory = !inferred['subcategory'] && !knowns['subcategory'];

	if (finalType === 'income' && stillMissingCategory && stillMissingSubcategory && !fallback) {
	  inferred['category'] = 'Earnings';
	  inferred['subcategory'] = 'Benefits';
	  inferred['__fallbackTag'] = 'income_default';
	  console.info('[SmartPaste] Applied income fallback: Earnings > Benefits');
	}
  }

  console.log('[SmartPaste] Inferred indirect fields:', inferred);
  return inferred;
} */


export function inferIndirectFields(
  text: string,
  knowns: Partial<Record<string, string>> = {}
): Record<string, string> {
  const rawText = (text + ' ' + (knowns.vendor || '')).toLowerCase();
  const inferred: Record<string, string> = {};

  // Step 1: Load keyword bank
  const keywordBank: KeywordMapping[] = JSON.parse(localStorage.getItem('xpensia_keyword_bank') || '[]') || [];
  if (!Array.isArray(keywordBank)) {
    console.error('[SmartPaste] Invalid keyword bank format:', keywordBank);
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
    const typeKeywords = JSON.parse(localStorage.getItem('xpensia_type_keywords') || '[]') || [];
    for (const entry of typeKeywords) {
      if (rawText.includes(entry.keyword.toLowerCase())) {
        inferred['type'] = entry.type;
        break;
      }
    }
  }

  // Step 4: Fallback vendor-based matching (only if category/subcategory are missing)
  const needsCategory = !inferred['category'] && !knowns['category'];
  const needsSubcategory = !inferred['subcategory'] && !knowns['subcategory'];

  if (needsCategory || needsSubcategory) {
    const vendorText = knowns.vendor || extractVendorName(text);
    const fallback = findClosestFallbackMatch(vendorText);
    console.log('[SmartPaste] Fallback vendorText used:', vendorText);
    console.log('[SmartPaste] Fallback result:', fallback);

    const finalType = inferred['type'] || knowns['type'];

    if (fallback && (!finalType || fallback.type.toLowerCase() === finalType.toLowerCase())) {
      if (needsCategory) inferred['category'] = fallback.category;
      if (needsSubcategory) inferred['subcategory'] = fallback.subcategory;
    }

    // Step 5: Absolute fallback for income type
    if (finalType === 'income' && !inferred['category'] && !inferred['subcategory']) {
      inferred['category'] = 'Earnings';
      inferred['subcategory'] = 'Benefits';
      inferred['__fallbackTag'] = 'income_default';
      console.info('[SmartPaste] Applied income fallback: Earnings > Benefits');
    }
  }

  console.log('[SmartPaste] Final inferred fields before return:', inferred);
  return inferred;
}





export function extractVendorName(message: string): string {
  const match = message.match(
    /(?:لدى|من|في|عند|من عند|تم الدفع لـ|تم الشراء من|at|from|paid to|purchased from)[:\s]*([^\n,؛;:\-]+)/i
  );

  if (match && match[1]) {
    const candidate = match[1].trim();

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

  console.warn("[extractVendorName] No valid vendor found for message:", message);
  return "";
}


