
import { registerPlugin } from '@capacitor/core';

export interface BackgroundSmsListenerPlugin {
  addListener(eventName: 'smsReceived', 
    listenerFunc: (data: { sender: string; body: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
  
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
}

export const BackgroundSmsListener = registerPlugin<BackgroundSmsListenerPlugin>('BackgroundSmsListener');
