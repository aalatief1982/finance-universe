// keywordBankUtils.ts

/**
 * Handles storage and retrieval of the keyword bank from localStorage.
 */

const KEY = 'xpensia_keyword_bank';

export interface KeywordEntry {
  keyword: string
  type: string
  lastUpdated?: string
  mappingCount?: number
  senderContext?: string
  transactionTypeContext?: string
  mappings: {
    field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor'
    value: string
  }[]
}

export function loadKeywordBank(): KeywordEntry[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveKeywordBank(bank: KeywordEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(bank));
}

export function deleteKeyword(keyword: string) {
  const bank = loadKeywordBank();
  const updated = bank.filter(entry => entry.keyword.toLowerCase() !== keyword.toLowerCase());
  saveKeywordBank(updated);
}
