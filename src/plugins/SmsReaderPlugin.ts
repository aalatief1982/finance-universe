
import { registerPlugin } from '@capacitor/core';

export interface SmsFilterOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  senders?: string[];
}

export interface SmsMessage {
  sender: string;
  message: string;
  date: string;
}

export interface SmsResult {
  messages: SmsMessage[];
}

export interface SmsReaderPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  readSmsMessages(options?: SmsFilterOptions): Promise<SmsResult>;
}

// Register the plugin
const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReaderPlugin');

export { SmsReader };
