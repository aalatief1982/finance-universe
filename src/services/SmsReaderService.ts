import { safeStorage } from "@/utils/safe-storage";

import { Capacitor } from "@capacitor/core";
import { SmsReader } from "../plugins/SmsReaderPlugin";
import { subMonths, startOfToday } from 'date-fns';
import { getSmsLookbackMonths } from '@/lib/env';

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
    if (import.meta.env.MODE === 'development') {
      console.log("[SmsReaderService] hasPermission() called");
    }

    if (!Capacitor.isNativePlatform()) {
      if (import.meta.env.MODE === 'development') {
        console.warn("[SmsReaderService] Not a native platform");
      }
      return false;
    }

    try {
      const result = await SmsReader.checkPermission();
      if (import.meta.env.MODE === 'development') {
        console.log("[SmsReaderService] hasPermission result:", result);
      }
      return result?.granted ?? false;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SmsReaderService] Error checking permission:", error);
      }
      return false;
    }
  }

  static async requestPermission(): Promise<boolean> {
    if (import.meta.env.MODE === 'development') {
      console.log("[SmsReaderService] requestPermission() called");
    }

    if (!Capacitor.isNativePlatform()) {
      if (import.meta.env.MODE === 'development') {
        console.warn("[SmsReaderService] Not a native platform");
      }
      return false;
    }

    try {
      const result = await SmsReader.requestPermission();
      if (import.meta.env.MODE === 'development') {
        console.log("[SmsReaderService] requestPermission result:", result);
      }
      return result?.granted ?? false;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SmsReaderService] Error requesting permission:", error);
      }
      return false;
    }
  }

  static async checkOrRequestPermission(): Promise<boolean> {
    // Only check permission, do not auto-request
    return SmsReaderService.hasPermission();
  }

  static async readSmsMessages(options: SmsReadOptions = {}): Promise<SmsEntry[]> {
    if (import.meta.env.MODE === 'development') {
      console.log('AIS-01 readSmsMessages', options);
    }

    if (!Capacitor.isNativePlatform()) {
      if (import.meta.env.MODE === 'development') {
        console.warn("[SmsReaderService] Not a native platform, returning empty list.");
      }
      return [];
    }

    const hasPerm = await SmsReaderService.hasPermission();
    if (!hasPerm) {
      throw new Error('SMS permission not granted');
    }

    // Determine the time range to query. If the caller did not supply a
    // start date we fall back to the "months back" value stored in local
    // storage. The end date defaults to "now" if not provided.
    const monthsBack = getSmsLookbackMonths();
    // Fetch limit to pass to the native plugin. Allows overriding via
    // localStorage. Defaults to a large value which is higher than the
    // plugin's default.
    const limit = parseInt(safeStorage.getItem('xpensia_sms_fetch_limit') || '500000');

    const startDate = (options.startDate
      ? options.startDate
      : subMonths(startOfToday(), monthsBack)
    ).getTime();
    const endDate = (options.endDate ? options.endDate : new Date()).getTime();

    if (import.meta.env.MODE === 'development') {
      console.log(`[SmsReaderService] Filtering from ${new Date(startDate).toISOString()} to ${new Date(endDate).toISOString()}`);
    }
    if (import.meta.env.MODE === 'development') {
      console.log(`[SmsReaderService] Scanning for messages between ${new Date(startDate).toLocaleString()} and ${new Date(endDate).toLocaleString()}`);
    }

    try {
      const { senders } = options;
      const result = await SmsReader.readSmsMessages({
        senders,
        startDate: String(startDate),
        endDate: String(endDate),
        limit,
      });
      
      if (!result || !Array.isArray(result.messages)) {
        if (import.meta.env.MODE === 'development') {
          console.warn("[SmsReaderService] Invalid SMS read result:", result);
        }
        return [];
      }

      return result.messages;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SmsReaderService] Error reading SMS messages:", error);
      }
      return [];
    }
  }
}
