
import { Capacitor } from "@capacitor/core";
import { SmsReader } from "../plugins/SmsReaderPlugin";
import { subMonths, startOfToday } from 'date-fns';

export interface SmsReadOptions {
  startDate?: Date;
  endDate?: Date;
  senders?: string[];
  limit?: number;
}

export interface SmsEntry {
  sender: string;
  message: string;
  date: string; // ISO string
}

export class SmsReaderService {
  static async hasPermission(): Promise<boolean> {
    console.log("[SmsReaderService] hasPermission() called");

    if (!Capacitor.isNativePlatform()) {
      console.warn("[SmsReaderService] Not a native platform");
      return false;
    }

    try {
      const result = await SmsReader.checkPermission();
      console.log("[SmsReaderService] hasPermission result:", result);
      return result?.granted ?? false;
    } catch (error) {
      console.error("[SmsReaderService] Error checking permission:", error);
      return false;
    }
  }

  static async requestPermission(): Promise<boolean> {
    console.log("[SmsReaderService] requestPermission() called");

    if (!Capacitor.isNativePlatform()) {
      console.warn("[SmsReaderService] Not a native platform");
      return false;
    }

    try {
      const result = await SmsReader.requestPermission();
      console.log("[SmsReaderService] requestPermission result:", result);
      return result?.granted ?? false;
    } catch (error) {
      console.error("[SmsReaderService] Error requesting permission:", error);
      return false;
    }
  }

  static async readSmsMessages(options: SmsReadOptions = {}): Promise<SmsEntry[]> {
    console.log("[SmsReaderService] readSmsMessages() called");

    if (!Capacitor.isNativePlatform()) {
      console.warn("[SmsReaderService] Not a native platform, returning empty list.");
      return [];
    }

    const hasPerm = await SmsReaderService.hasPermission();
    if (!hasPerm) {
      throw new Error('SMS permission not granted');
    }

    const monthsBack = parseInt(localStorage.getItem('xpensia_sms_period_months') || '6');
    const startDate = subMonths(startOfToday(), monthsBack).getTime();
    const endDate = Date.now();
    console.log(`[SmsReaderService] Filtering from ${new Date(startDate).toISOString()} to ${new Date(endDate).toISOString()}`);
    console.log(`[SmsReaderService] Scanning for messages between ${new Date(startDate).toLocaleString()} and ${new Date(endDate).toLocaleString()}`);

    try {
      const result = await SmsReader.readSmsMessages({
        ...options,
        limit: options.limit ?? 10000,
        startDate: String(startDate),
        endDate: String(endDate),
      });
      
      if (!result || !Array.isArray(result.messages)) {
        console.warn("[SmsReaderService] Invalid SMS read result:", result);
        return [];
      }

      return result.messages;
    } catch (error) {
      console.error("[SmsReaderService] Error reading SMS messages:", error);
      return [];
    }
  }
}
