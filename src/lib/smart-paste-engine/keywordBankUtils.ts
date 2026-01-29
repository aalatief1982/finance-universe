import { safeStorage } from "@/utils/safe-storage";
// keywordBankUtils.ts

/**
 * Handles storage and retrieval of the keyword bank from localStorage.
 */

const KEY = 'xpensia_keyword_bank';

export interface KeywordEntry {
  keyword: string;
  type?: string;
  mappings: { field: string; value: string }[];
  lastUpdated?: string;
  mappingCount?: number;
  source?: 'manual' | 'sms-learn' | 'csv-import';
}

export function loadKeywordBank(): KeywordEntry[] {
  const raw = safeStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveKeywordBank(bank: KeywordEntry[]) {
  safeStorage.setItem(KEY, JSON.stringify(bank));
}

export function deleteKeyword(keyword: string) {
  const bank = loadKeywordBank();
  const updated = bank.filter(entry => entry.keyword.toLowerCase() !== keyword.toLowerCase());
  saveKeywordBank(updated);
}
