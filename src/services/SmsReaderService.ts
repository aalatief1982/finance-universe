import { Capacitor } from '@capacitor/core';

export interface SmsReadOptions {
  startDate?: Date;
  endDate?: Date;
  senders?: string[];
  limit?: number;
}

export interface SmsEntry {
  sender: string;
  message: string;
  date: string; // ISO format
}

export class SmsReaderService {
  async hasPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const result = await (window as any).SmsReaderPlugin?.checkPermission?.();
    return result?.granted ?? false;
  }

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const result = await (window as any).SmsReaderPlugin?.requestPermission?.();
    return result?.granted ?? false;
  }

  async readMessages(options: SmsReadOptions): Promise<SmsEntry[]> {
    if (!Capacitor.isNativePlatform()) return [];
    const result = await (window as any).SmsReaderPlugin?.readSmsMessages?.(options);
    return result?.messages ?? [];
  }
}
