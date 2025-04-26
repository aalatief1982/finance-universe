
import { registerPlugin } from '@capacitor/core';

export interface SmsReaderPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  readSmsMessages(options: {
    senders?: string[];
    limit?: number;
  }): Promise<{ messages: any[] }>;
}

// Register the plugin using the exact same name as in the Java class annotation
export const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReaderPlugin');
