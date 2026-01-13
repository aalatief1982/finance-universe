
import { Capacitor } from '@capacitor/core';

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
  checkPermissionWithRationale(): Promise<{ granted: boolean; shouldShowRationale: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  readSmsMessages(options?: SmsFilterOptions): Promise<SmsResult>;
}

// Register the plugin
const SmsReader = Capacitor.registerPlugin<SmsReaderPlugin>('SmsReaderPlugin');

export { SmsReader };
