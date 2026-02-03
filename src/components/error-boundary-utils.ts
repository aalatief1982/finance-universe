import { safeStorage } from '@/utils/safe-storage';

const LAST_ERROR_KEY = 'xpensia_last_error';

export interface StoredError {
  route: string;
  boundaryName: string;
  message: string;
  stack?: string;
  timestamp: string;
}

export function storeLastError(error: StoredError): void {
  try {
    safeStorage.setItem(LAST_ERROR_KEY, JSON.stringify(error));
  } catch {
    // Ignore storage errors
  }
}

export function getLastStoredError(): StoredError | null {
  try {
    const raw = safeStorage.getItem(LAST_ERROR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredError;
  } catch {
    return null;
  }
}

export function clearStoredError(): void {
  safeStorage.removeItem(LAST_ERROR_KEY);
}
