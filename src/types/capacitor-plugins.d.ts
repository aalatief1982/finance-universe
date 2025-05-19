
declare module '@capacitor/core' {
  interface PluginRegistry {
    BackgroundSmsListener: any;
  }
}

declare module 'capacitor-background-sms-listener' {
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
  
  export const BackgroundSmsListener: BackgroundSmsListenerPlugin;
}
