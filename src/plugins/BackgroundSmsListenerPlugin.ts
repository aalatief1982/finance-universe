import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface BackgroundSmsListenerPlugin {
  addListener(
    eventName: 'smsReceived',
    listenerFunc: (data: { sender: string; body: string }) => void
  ): Promise<PluginListenerHandle>;

  checkPermission(): Promise<{ granted: boolean }>;
  checkPermissionWithRationale(): Promise<{ granted: boolean; shouldShowRationale: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  drainPersistedMessages(): Promise<{
    messages: Array<{ sender: string; body: string; receivedAt?: number; source?: string }>;
  }>;
  consumePendingOpenRoute(): Promise<{ route?: string; source?: string }>;
}

const BackgroundSmsListener = Capacitor.registerPlugin<BackgroundSmsListenerPlugin>('BackgroundSmsListener');

export { BackgroundSmsListener };
