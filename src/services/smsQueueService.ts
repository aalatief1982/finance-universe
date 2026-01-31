/**
 * @file smsQueueService.ts
 * @description Persists queued inbound SMS messages for later processing.
 *
 * @module services/smsQueueService
 *
 * @responsibilities
 * 1. Store queued SMS messages in preferences (native) or localStorage (web)
 * 2. Provide helpers to add, read, and clear the queue
 *
 * @storage-keys
 * - newIncomingBuffer: queued SMS payloads
 *
 * @dependencies
 * - safe-storage.ts: safeStorage + safePreferences wrappers
 *
 * @review-tags
 * - @platform: native vs web storage
 * - @risk: JSON parse failures on corrupted storage
 *
 * @review-checklist
 * - [ ] Native uses Capacitor Preferences
 * - [ ] Web fallback uses localStorage
 * - [ ] Queue reads default to empty array
 */

import { safeStorage, safePreferences } from "@/utils/safe-storage";
import { Capacitor } from '@capacitor/core';

export interface QueuedSms {
  sender: string;
  body: string;
}

const QUEUE_KEY = 'newIncomingBuffer';

export const getQueuedMessages = async (): Promise<QueuedSms[]> => {
  if (Capacitor.isNativePlatform()) {
    const { value } = await safePreferences.get({ key: QUEUE_KEY });
    return value ? JSON.parse(value) : [];
  }
  const stored = safeStorage.getItem(QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearQueuedMessages = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await safePreferences.remove({ key: QUEUE_KEY });
  } else {
    safeStorage.removeItem(QUEUE_KEY);
  }
};

export const addToQueue = async (sms: QueuedSms): Promise<void> => {
  const currentQueue = await getQueuedMessages();
  const updatedQueue = [...currentQueue, sms];
  
  if (Capacitor.isNativePlatform()) {
    await safePreferences.set({
      key: QUEUE_KEY,
      value: JSON.stringify(updatedQueue)
    });
  } else {
    safeStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  }
};
