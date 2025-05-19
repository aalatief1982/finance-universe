import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface BackgroundSmsListenerPlugin {
  addListener(
    eventName: 'smsReceived',
    listenerFunc: (data: { sender: string; body: string }) => void
  ): Promise<PluginListenerHandle>;
  
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
}

const BackgroundSmsListener = registerPlugin<BackgroundSmsListenerPlugin>('BackgroundSmsListener', {});

export { BackgroundSmsListener };
