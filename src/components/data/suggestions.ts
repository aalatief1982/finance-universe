import { safeStorage } from "@/utils/safe-storage";
export interface SuggestionEntry {
  type: string;
  category: string;
  updatedAt: string;
}

const KEY = 'xpensia_vendor_suggestions';

export function listSuggestions(): Record<string, SuggestionEntry> {
  try {
    const raw = safeStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearSuggestions() {
  safeStorage.removeItem(KEY);
}
