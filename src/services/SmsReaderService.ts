
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

// Interface to track processed messages in localStorage
export interface ProcessedMessagesTracker {
  lastProcessedDate: string;
  messageIds: { [key: string]: boolean };  // Using a map for O(1) lookup
}

export class SmsReaderService {
  // Key for localStorage
  private static readonly PROCESSED_MESSAGES_KEY = 'xpensia_processed_sms_messages';

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

  /**
   * Get the tracker object from localStorage
   */
  static getProcessedMessagesTracker(): ProcessedMessagesTracker {
    try {
      const trackerJson = localStorage.getItem(SmsReaderService.PROCESSED_MESSAGES_KEY);
      if (trackerJson) {
        return JSON.parse(trackerJson);
      }
    } catch (error) {
      console.error("[SmsReaderService] Error reading message tracker from localStorage:", error);
    }
    
    // Return default empty tracker if not found or error
    return {
      lastProcessedDate: '',
      messageIds: {}
    };
  }

  /**
   * Save the tracker object to localStorage
   */
  static saveProcessedMessagesTracker(tracker: ProcessedMessagesTracker): void {
    try {
      localStorage.setItem(SmsReaderService.PROCESSED_MESSAGES_KEY, JSON.stringify(tracker));
      console.log("[SmsReaderService] Updated message tracker in localStorage");
    } catch (error) {
      console.error("[SmsReaderService] Error saving message tracker to localStorage:", error);
    }
  }

  /**
   * Generate a unique ID for a message to avoid duplicates
   */
  static generateMessageId(message: SmsEntry): string {
    return `${message.sender}_${message.date}_${message.message.substring(0, 20)}`;
  }

  static async readSmsMessages(options: SmsReadOptions = {}): Promise<SmsEntry[]> {
    console.log("[SmsReaderService] readSmsMessages() called");

    if (!Capacitor.isNativePlatform()) {
      console.warn("[SmsReaderService] Not a native platform, returning empty list.");
      return [];
    }

    const hasPerm = await SmsReaderService.hasPermission();
    if (!hasPerm) {
      console.error("[SmsReaderService] Permission not granted");
      throw new Error('SMS permission not granted');
    }

    // Get the tracker to check for already processed messages
    const tracker = SmsReaderService.getProcessedMessagesTracker();
    console.log("[SmsReaderService] Last processed date:", tracker.lastProcessedDate);
    
    // Determine the start date - use tracker date if available, otherwise use configured months back
    let startDate: number;
    
    if (tracker.lastProcessedDate && !options.startDate) {
      // If we have a last processed date and user didn't explicitly specify a start date
      startDate = new Date(tracker.lastProcessedDate).getTime();
      console.log("[SmsReaderService] Using last processed date as start date:", new Date(startDate).toLocaleString());
    } else {
      // If no tracker date or user explicitly specified a start date, use the configured months back
      const monthsBack = parseInt(localStorage.getItem('xpensia_sms_period_months') || '6');
      startDate = options.startDate ? options.startDate.getTime() : subMonths(startOfToday(), monthsBack).getTime();
      console.log(`[SmsReaderService] Looking back ${monthsBack} months`);
    }
    
    const endDate = options.endDate ? options.endDate.getTime() : Date.now();
    
    console.log(`[SmsReaderService] Filtering from ${new Date(startDate).toISOString()} to ${new Date(endDate).toISOString()}`);
    console.log(`[SmsReaderService] Scanning for messages between ${new Date(startDate).toLocaleString()} and ${new Date(endDate).toLocaleString()}`);

    try {
      const result = await SmsReader.readSmsMessages({
        ...options,
        startDate: String(startDate),
        endDate: String(endDate),
      });
      
      if (!result || !Array.isArray(result.messages)) {
        console.warn("[SmsReaderService] Invalid SMS read result:", result);
        return [];
      }

      // Filter out messages we've already processed
      const newMessages = result.messages.filter(msg => {
        const messageId = SmsReaderService.generateMessageId(msg);
        return !tracker.messageIds[messageId];
      });

      console.log(`[SmsReaderService] Total messages: ${result.messages.length}, New messages: ${newMessages.length}`);
      
      // Update the tracker with new messages
      if (newMessages.length > 0) {
        // Find the latest date in the fetched messages
        const latestDate = newMessages.reduce((latest, msg) => {
          const msgDate = new Date(msg.date).getTime();
          return msgDate > latest ? msgDate : latest;
        }, 0);
        
        // Update the tracker
        newMessages.forEach(msg => {
          const messageId = SmsReaderService.generateMessageId(msg);
          tracker.messageIds[messageId] = true;
        });
        
        // Only update the last processed date if we found a newer one
        if (latestDate > 0) {
          tracker.lastProcessedDate = new Date(latestDate).toISOString();
        }
        
        // Save the updated tracker
        SmsReaderService.saveProcessedMessagesTracker(tracker);
      }

      return newMessages;
    } catch (error) {
      console.error("[SmsReaderService] Error reading SMS messages:", error);
      return [];
    }
  }

  /**
   * Clear the message tracking data (useful for testing or reset)
   */
  static clearProcessedMessagesTracker(): void {
    try {
      localStorage.removeItem(SmsReaderService.PROCESSED_MESSAGES_KEY);
      console.log("[SmsReaderService] Cleared message tracker from localStorage");
    } catch (error) {
      console.error("[SmsReaderService] Error clearing message tracker:", error);
    }
  }
}
