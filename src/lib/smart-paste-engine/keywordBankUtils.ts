// keywordBankUtils.ts

/**
 * Handles storage and retrieval of the keyword bank from localStorage.
 */

const KEY = 'xpensia_keyword_bank';

export interface KeywordMapping {
  keyword: string;
  mappings: {
    field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor';
    value: string;
  }[];
}

export function loadKeywordBank(): KeywordMapping[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveKeywordBank(bank: KeywordMapping[]) {
  localStorage.setItem(KEY, JSON.stringify(bank));
}

export function deleteKeyword(keyword: string) {
  const bank = loadKeywordBank();
  const updated = bank.filter(entry => entry.keyword.toLowerCase() !== keyword.toLowerCase());
  saveKeywordBank(updated);
}
