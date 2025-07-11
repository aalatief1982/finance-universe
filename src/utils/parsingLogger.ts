import { safeStorage } from "@/utils/safe-storage";
export interface ParsingLogEntry {
  smsId: string;
  timestamp: number;
}

const LOG_KEY = 'xpensia_parsing_failures';

export function logParsingFailure(smsId: string) {
  try {
    const existing: ParsingLogEntry[] = JSON.parse(safeStorage.getItem(LOG_KEY) || '[]');
    existing.push({ smsId, timestamp: Date.now() });
    safeStorage.setItem(LOG_KEY, JSON.stringify(existing.slice(-100)));
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('[ParsingLogger] Failed to log parsing failure', err);
    }
  }
}
