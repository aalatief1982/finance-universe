import stringSimilarity from 'string-similarity';
import { loadVendorFallbacks, VendorFallbackData } from './vendorFallbackUtils';

const BANK_KEY = 'xpensia_keyword_bank';

export interface KeywordMapping {
  keyword: string;
  mappings: {
    field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor';
    value: string;
  }[];
}

interface FallbackVendorEntry extends VendorFallbackData {
  vendor: string;
}

const getFallbackVendors = (): Record<string, VendorFallbackData> => {
  console.log('[SmartPaste] Loading fallback vendors...');
  return loadVendorFallbacks();
};

const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const softNormalize = (str: string): string =>
  str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();

export function findClosestFallbackMatch(vendorName: string): FallbackVendorEntry | null {
  console.log('[SmartPaste] Starting fallback match for vendor:', vendorName);
  const lowerInput = softNormalize(vendorName);
  const fallbackVendors = getFallbackVendors();
  let vendorKeys: string[];
  try {
    vendorKeys = Object.keys(fallbackVendors);
  } catch (e) {
    console.warn('[SmartPaste] Invalid fallback vendor structure:', fallbackVendors);
    return null;
  }

  if (!Array.isArray(vendorKeys) || vendorKeys.some(k => typeof k !== 'string')) {
    console.warn('[SmartPaste] Invalid fallback vendor keys:', vendorKeys);
    return null;
  }

  const match = stringSimilarity.findBestMatch(lowerInput, vendorKeys.map(softNormalize));
  const originalKeysMap = Object.fromEntries(vendorKeys.map(key => [softNormalize(key), key]));

  if (match.bestMatch.rating >= 0.7) {
    const normalizedKey = match.bestMatch.target;
    const originalKey = originalKeysMap[normalizedKey];
    const data = fallbackVendors[originalKey];
    console.info('[SmartPaste] Fuzzy matched vendor:', originalKey, '→', data);
    return { vendor: originalKey, ...data };
  }

  for (const key of vendorKeys) {
    const normalizedKey = softNormalize(key);
    if (normalizedKey.length < 4) continue;
    const pattern = new RegExp(`\\b${escapeRegex(normalizedKey)}\\b`);
    if (pattern.test(lowerInput)) {
      const data = fallbackVendors[key];
      console.info('[SmartPaste] Substring matched vendor:', key, '→', data);
      return { vendor: key, ...data };
    }
  }

  console.warn('[SmartPaste] No fallback match found for vendor:', vendorName);
  return null;
}

export function inferIndirectFields(
  text: string,
  knowns: Partial<Record<string, string>> = {}
): Record<string, string> {
  console.log('[SmartPaste] Starting indirect field inference...');
  const rawText = (text + ' ' + (knowns.vendor || '')).toLowerCase();
  const inferred: Record<string, string> = {};

  console.log('[SmartPaste] Raw text used for inference:', rawText);

  const keywordBank: KeywordMapping[] = JSON.parse(localStorage.getItem(BANK_KEY) || '[]') || [];
  console.log('[SmartPaste] Loaded keyword bank:', keywordBank);

  keywordBank.forEach(({ keyword, mappings }) => {
    if (rawText.includes(keyword.toLowerCase())) {
      console.log(`[SmartPaste] Matched keyword: "${keyword}"`);
      mappings.forEach(({ field, value }) => {
        if (!value || typeof value !== 'string') return;
        if (!inferred[field] && !knowns[field]) {
          inferred[field] = value.trim();
          console.log(`[SmartPaste] Inferred ${field} from keyword:`, value);
        }
      });
    }
  });

  if (!inferred['type']) {
    const typeKeywords = JSON.parse(localStorage.getItem('xpensia_type_keywords') || '[]') || [];
    console.log('[SmartPaste] Loaded type keywords:', typeKeywords);

    for (const entry of typeKeywords) {
      if (rawText.includes(entry.keyword.toLowerCase())) {
        inferred['type'] = entry.type;
        console.log('[SmartPaste] Inferred type from typeKeywords:', entry.type);
        break;
      }
    }
  }

  const needsCategory = !inferred['category'] && !knowns['category'];
  const needsSubcategory = !inferred['subcategory'] && !knowns['subcategory'];

  if (needsCategory || needsSubcategory) {
    const vendorText = knowns.vendor || extractVendorName(text);
    const fallback = findClosestFallbackMatch(vendorText);
    console.log('[SmartPaste] Fallback vendorText used:', vendorText);
    console.log('[SmartPaste] Fallback result:', fallback);

    const finalType = inferred['type'] || knowns['type'];

    if (fallback && (!finalType || fallback.type.toLowerCase() === finalType.toLowerCase())) {
      if (needsCategory) {
        inferred['category'] = fallback.category;
        console.log('[SmartPaste] Inferred category from fallback:', fallback.category);
      }
      if (needsSubcategory) {
        inferred['subcategory'] = fallback.subcategory;
        console.log('[SmartPaste] Inferred subcategory from fallback:', fallback.subcategory);
      }
    }

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
  console.log('[SmartPaste] Extracting vendor from message:', message);
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

    if (isValidVendor) {
      console.log('[SmartPaste] Extracted vendor candidate:', candidate);
      return candidate;
    }
  }

  const lowerText = message.toLowerCase();
  if (lowerText.includes("راتب") || lowerText.includes("salary")) {
    console.log('[SmartPaste] Fallback vendor: Company (due to salary keyword)');
    return "Company";
  }

  console.warn("[SmartPaste] No valid vendor found for message:", message);
  return "";
}
