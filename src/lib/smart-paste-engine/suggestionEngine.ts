/**
 * Suggests indirect transaction fields using keyword mappings.
 * Reads from localStorage['xpensia_keyword_bank'].
 */

import stringSimilarity from 'string-similarity';
import * as vendorData from '../../data/ksa_all_vendors_clean_final.json';
const fallbackVendors: FallbackVendorEntry[] = (vendorData as any).default ?? vendorData;

const BANK_KEY = 'xpensia_keyword_bank';

export interface KeywordMapping {
  keyword: string;
  mappings: {
    field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor';
    value: string;
  }[];
}

interface FallbackVendorEntry {
  vendor: string;
  type: 'expense' | 'income' | 'transfer';
  category: string;
  subcategory: string;
}

export function findClosestFallbackMatch(vendorName: string): FallbackVendorEntry | null {
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



export function inferIndirectFields(
  text: string,
  knowns: Partial<Record<string, string>> = {}
): Record<string, string> {
  const rawText = (text + ' ' + (knowns.vendor || '')).toLowerCase();
  const inferred: Record<string, string> = {};
 //const keywordBank: KeywordMapping[] = JSON.parse(localStorage.getItem(BANK_KEY) || '[]') || [];
 
 const keywordBank: KeywordMapping[] = JSON.parse(localStorage.getItem(BANK_KEY) || '[]') || [];
if (!Array.isArray(keywordBank)) {
  console.error('[ERROR] Invalid keyword bank data:', keywordBank);
}
 console.log('[DEBUG] keywordBank:', keywordBank);
console.log('[DEBUG] fallbackVendors:', fallbackVendors);
  // ⬇️ Keyword-based inference
keywordBank.forEach(({ keyword, mappings }) => {
  if (rawText.includes(keyword.toLowerCase())) {
    mappings.forEach(({ field, value }) => {
      if (typeof value !== 'string' || !value) {
        console.warn(`[KeywordMapping] Skipping invalid value for field "${field}":`, value);
        return; // Skip invalid entries
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

// ⬇️ Fallback vendor inference only if category/subcategory missing
const needsFallback = ['category', 'subcategory'].some(f => !inferred[f] && !knowns[f]);
if (needsFallback) {
  const vendorText = knowns.vendor || extractVendorName(text);
  const fallback = findClosestFallbackMatch(vendorText);
  console.log("Fallback vendorText used:", vendorText);
	console.log("Fallback result:", fallback);
  if (fallback) {
    if (!inferred['category'] && !knowns['category']) inferred['category'] = fallback.category;
    if (!inferred['subcategory'] && !knowns['subcategory']) inferred['subcategory'] = fallback.subcategory;
  
  	
  }
}

  console.log('[SmartPaste] Inferred indirect fields:', inferred);
  return inferred;
}

export function extractVendorName(message: string): string {
  const match = message.match(/(?:لدى|من|في|عند|من عند|تم الدفع لـ|تم الشراء من|at|from|paid to|purchased from)[:\s]*([^\n,؛;:\-]+)/i);
  
  if (match && match[1]) {
    return match[1].trim();
  }

  console.warn('[extractVendorName] No vendor name matched for message:', message);
  return '';
}

