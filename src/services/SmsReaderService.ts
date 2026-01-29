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

export interface SmsPermissionStatus {
  granted: boolean;
  shouldShowRationale: boolean;
}

export class SmsReaderService {
  static async hasPermission(): Promise<boolean> {
    if (import.meta.env.MODE === 'development') {
      // console.log("[SmsReaderService] hasPermission() called");
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
        // console.log("[SmsReaderService] hasPermission result:", result);
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
      // console.log("[SmsReaderService] requestPermission() called");
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
        // console.log("[SmsReaderService] requestPermission result:", result);
      }
      return result?.granted ?? false;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SmsReaderService] Error requesting permission:", error);
      }
      return false;
    }
  }

  // Add caching/in-flight guard and TTL to rationale checks
  static lastRationaleResult: { granted: boolean; shouldShowRationale: boolean; timestamp: number } | null = null;
  static inFlightRationalePromise: Promise<any> | null = null;
  static RATIONALE_TTL = 20000; // 20 seconds

  static async checkPermissionWithRationale(force = false): Promise<SmsPermissionStatus> {
    if (import.meta.env.MODE === 'development') {
      // console.log("[SmsReaderService] checkPermissionWithRationale() called");
    }

    if (!Capacitor.isNativePlatform()) {
      if (import.meta.env.MODE === 'development') {
        console.warn("[SmsReaderService] Not a native platform");
      }
      return { granted: false, shouldShowRationale: true };
    }

    const now = Date.now();
    if (!force && SmsReaderService.lastRationaleResult && now - SmsReaderService.lastRationaleResult.timestamp < SmsReaderService.RATIONALE_TTL) {
      return SmsReaderService.lastRationaleResult;
    }
    if (SmsReaderService.inFlightRationalePromise) return SmsReaderService.inFlightRationalePromise;
    SmsReaderService.inFlightRationalePromise = (async () => {
      try {
        const result = await SmsReader.checkPermissionWithRationale();
        if (import.meta.env.MODE === 'development') {
          // console.log("[SmsReaderService] checkPermissionWithRationale result:", result);
        }
        SmsReaderService.lastRationaleResult = {
          granted: result?.granted ?? false,
          shouldShowRationale: result?.shouldShowRationale ?? true,
          timestamp: Date.now(),
        };
        return SmsReaderService.lastRationaleResult;
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error("[SmsReaderService] Error checking permission rationale:", error);
        }
        return { granted: false, shouldShowRationale: true };
      } finally {
        SmsReaderService.inFlightRationalePromise = null;
      }
    })();
    return SmsReaderService.inFlightRationalePromise;
  }

  static async checkOrRequestPermission(): Promise<boolean> {
    // Only check permission, do not auto-request
    return SmsReaderService.hasPermission();
  }

  static async readSmsMessages(options: SmsReadOptions = {}): Promise<SmsEntry[]> {
    if (import.meta.env.MODE === 'development') {
      // console.log('AIS-01 readSmsMessages', options);
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
    // Fetch limit to pass to the native plugin. Use a reasonable default
    // to prevent OutOfMemoryError crashes when serializing large JSON payloads.
    // The previous default of 500000 caused 75MB+ allocations that exceeded heap limits.
    const MAX_SAFE_LIMIT = 2000; // ~2-3MB of JSON data max
    const userLimit = options.limit ?? parseInt(safeStorage.getItem('xpensia_sms_fetch_limit') || String(MAX_SAFE_LIMIT));
    const limit = Math.min(userLimit, MAX_SAFE_LIMIT);

    const startDate = (options.startDate
      ? options.startDate
      : subMonths(startOfToday(), monthsBack)
    ).getTime();
    const endDate = (options.endDate ? options.endDate : new Date()).getTime();

    if (import.meta.env.MODE === 'development') {
      // console.log(`[SmsReaderService] Filtering from ${new Date(startDate).toISOString()} to ${new Date(endDate).toISOString()}`);
    }
    if (import.meta.env.MODE === 'development') {
      // console.log(`[SmsReaderService] Scanning for messages between ${new Date(startDate).toLocaleString()} and ${new Date(endDate).toLocaleString()}`);
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
