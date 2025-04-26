import { Capacitor } from '@capacitor/core';
import { SmsReader } from '@/plugins/SmsReaderPlugin'; // ✅


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
  console.log("hasPermission() called");
  if (!Capacitor.isNativePlatform()) return false;
  const result = await (window as any).SmsReaderPlugin?.checkPermission?.();
  console.log("hasPermission() result:", result);
  return result?.granted ?? false;
}

async requestPermission(): Promise<boolean> {
  console.log("requestPermission() called");
  
  if (!Capacitor.isNativePlatform()) return false;
  //const result = await (window as any).SmsReaderPlugin?.requestPermission?.();
   const result = await SmsReader.requestPermission();
  console.log("requestPermission() result:", result);
  return result?.granted ?? false;
}

async readMessages(options: SmsReadOptions): Promise<SmsEntry[]> {
  console.log("readMessages() called");

  if (!Capacitor.isNativePlatform()) {
    console.log("Not a native platform. Skipping SMS reading.");
    return [];
  }

  const hasPerm = await this.hasPermission();
  console.log("Initial hasPermission check:", hasPerm);

  if (!hasPerm) {
    console.log("Permission missing, requesting permission...");
    const granted = await this.requestPermission();
    console.log("Result after requestPermission:", granted);

    if (!granted) {
      console.log("User denied SMS permission.");
      throw new Error('SMS permission not granted');
    }
  } else {
    console.log("Permission already granted, proceeding to read messages...");
  }

  console.log("Calling native plugin to read SMS messages...");
  const result = await (window as any).SmsReaderPlugin?.readSmsMessages?.(options);
  console.log("Result from native plugin read:", result);

  return result?.messages ?? [];
}


}
