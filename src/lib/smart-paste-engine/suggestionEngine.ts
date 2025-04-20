/**
 * Suggests indirect transaction fields using keyword mappings.
 * Reads from localStorage['xpensia_keyword_bank'].
 */

const BANK_KEY = 'xpensia_keyword_bank';

export interface KeywordMapping {
  keyword: string;
  mappings: {
    field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor';
    value: string;
  }[];
}

/**
 * Infer indirect transaction fields based on vendor text or message content.
 * Prioritizes first match for each field. Doesn't override known values.
 *
 * @param text - full SMS text
 * @param knowns - already known values (e.g., vendor from template)
 * @returns Record of inferred fields like type, category, etc.
 */
export function inferIndirectFields(
  text: string,
  knowns: Partial<Record<string, string>> = {}
): Record<string, string> {
  const rawText = (text + ' ' + (knowns.vendor || '')).toLowerCase();
  const inferred: Record<string, string> = {};
  const keywordBank: KeywordMapping[] = JSON.parse(localStorage.getItem(BANK_KEY) || '[]');

  keywordBank.forEach(({ keyword, mappings }) => {
    if (rawText.includes(keyword.toLowerCase())) {
      mappings.forEach(({ field, value }) => {
        // Only assign if not already inferred or passed as known
        if (!inferred[field] && !knowns[field]) {
          inferred[field] = value;
        }
      });
    }
  });
  
  // After keywordBank inference
if (!inferred['type']) {
  const typeKeywords = JSON.parse(localStorage.getItem('xpensia_type_keywords') || '[]');
  for (const entry of typeKeywords) {
    if (rawText.includes(entry.keyword.toLowerCase())) {
      inferred['type'] = entry.type;
      break;
    }
  }
}

  console.log('[SmartPaste] Inferred indirect fields from keyword bank:', inferred);
  return inferred;
}
