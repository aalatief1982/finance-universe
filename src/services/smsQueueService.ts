import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface QueuedSms {
  sender: string;
  body: string;
}

const QUEUE_KEY = 'newIncomingBuffer';

export const getQueuedMessages = async (): Promise<QueuedSms[]> => {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: QUEUE_KEY });
    return value ? JSON.parse(value) : [];
  }
  const stored = localStorage.getItem(QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearQueuedMessages = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: QUEUE_KEY });
  } else {
    localStorage.removeItem(QUEUE_KEY);
  }
};

