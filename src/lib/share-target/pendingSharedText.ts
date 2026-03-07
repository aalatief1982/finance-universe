import { safeStorage } from '@/utils/safe-storage';

const STORAGE_KEY = 'xpensia_pending_shared_text_v1';

export interface PendingSharedTextPayload {
  text: string;
  source?: string;
  receivedAt?: number;
}

const normalize = (payload: PendingSharedTextPayload): PendingSharedTextPayload | null => {
  const text = payload.text?.trim();
  if (!text) {
    return null;
  }

  return {
    text,
    source: payload.source,
    receivedAt: payload.receivedAt,
  };
};

export const savePendingSharedText = (payload: PendingSharedTextPayload): boolean => {
  const normalized = normalize(payload);
  if (!normalized) {
    return false;
  }

  safeStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return true;
};

export const readPendingSharedText = (): PendingSharedTextPayload | null => {
  const raw = safeStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingSharedTextPayload;
    return normalize(parsed);
  } catch {
    return null;
  }
};

export const clearPendingSharedText = (): void => {
  safeStorage.removeItem(STORAGE_KEY);
};
