export interface KeywordMapping {
  field: string;
  value: string | undefined;
}

export interface KeywordEntry {
  keyword: string;
  mappings: KeywordMapping[];
}

const KEY = 'xpensia_keyword_bank';

export function loadKeywordBank(): KeywordEntry[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) as KeywordEntry[] : [];
}

export function saveKeywordBank(bank: KeywordEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(bank));
}
