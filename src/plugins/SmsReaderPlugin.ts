// src/plugins/SmsReaderPlugin.ts
import { registerPlugin } from '@capacitor/core';

export interface SmsReaderPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  readSmsMessages(options: {
    startDate?: Date;
    endDate?: Date;
    senders?: string[];
    limit?: number;
  }): Promise<{ messages: any[] }>;
}

export const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReaderPlugin');
