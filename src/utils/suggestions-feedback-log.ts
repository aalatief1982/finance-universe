import { safeStorage } from "@/utils/safe-storage";
export interface SuggestionsFeedbackEntry {
  field: string;
  positive: boolean;
  value?: any;
  timestamp: string;
}

const KEY = 'suggestionsFeedbackLog';

export const getSuggestionsFeedbackLog = (): SuggestionsFeedbackEntry[] => {
  try {
    const raw = safeStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addSuggestionsFeedbackEntry = (entry: SuggestionsFeedbackEntry) => {
  const log = getSuggestionsFeedbackLog();
  log.push(entry);
  try {
    safeStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    // ignore write errors
  }
};
