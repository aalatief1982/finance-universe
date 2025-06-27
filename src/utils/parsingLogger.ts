export interface ParsingLogEntry {
  smsId: string;
  timestamp: number;
}

const LOG_KEY = 'xpensia_parsing_failures';

export function logParsingFailure(smsId: string) {
  try {
    const existing: ParsingLogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    existing.push({ smsId, timestamp: Date.now() });
    localStorage.setItem(LOG_KEY, JSON.stringify(existing.slice(-100)));
  } catch (err) {
    console.error('[ParsingLogger] Failed to log parsing failure', err);
  }
}
