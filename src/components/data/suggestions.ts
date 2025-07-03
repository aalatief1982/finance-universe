export interface SuggestionEntry {
  type: string;
  category: string;
  updatedAt: string;
}

const KEY = 'xpensia_vendor_suggestions';

export function listSuggestions(): Record<string, SuggestionEntry> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearSuggestions() {
  localStorage.removeItem(KEY);
}
