
import { registerPlugin } from '@capacitor/core';

export interface SmsReaderPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  readSmsMessages(options?: { 
    startDate?: string;
    endDate?: string;
    limit?: number;
    senders?: string[];
  }): Promise<{ messages: Array<{ sender: string; message: string; date: string }> }>;
}

export const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReaderPlugin');
