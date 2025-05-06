import { registerPlugin } from "@capacitor/core";

export interface SmsReaderPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  readSmsMessages(options: {
    startDate?: string;
    endDate?: string;
    senders?: string[];
    limit?: number;
  }): Promise<{ messages: { sender: string; message: string; date: string }[] }>;
}

export const SmsReader = registerPlugin<SmsReaderPlugin>("SmsReaderPlugin");
