
import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";

const SmsReader = registerPlugin<any>("SmsReaderPlugin");

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

  static async readMessages(options: SmsReadOptions): Promise<SmsEntry[]> {
    console.log("[SmsReaderService] readMessages() called with options:", options);

    if (!Capacitor.isNativePlatform()) {
      console.warn("[SmsReaderService] Not a native platform");
      return [];
    }

    const hasPerm = await this.hasPermission();
    if (!hasPerm) {
      console.log("[SmsReaderService] No permission, requesting...");
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn("[SmsReaderService] Permission denied");
        throw new Error("SMS permission not granted");
      }
    }

    try {
      const result = await SmsReader.readSmsMessages({
        startDate: options.startDate?.toISOString(),
        endDate: options.endDate?.toISOString(),
        senders: options.senders,
        limit: options.limit,
      });

      console.log("[SmsReaderService] Read messages result:", result);
      return result?.messages ?? [];
    } catch (error) {
      console.error("[SmsReaderService] Error reading messages:", error);
      throw new Error("Failed to read SMS messages");
    }
  }
}
