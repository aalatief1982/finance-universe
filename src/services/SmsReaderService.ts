
import { Capacitor } from "@capacitor/core";
import { SmsReader } from "../plugins/SmsReaderPlugin";

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
      // Only pass the parameters that are actually supported by the Java plugin
      const result = await SmsReader.readSmsMessages({
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
