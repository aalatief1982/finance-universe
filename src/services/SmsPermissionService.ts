
import { Capacitor } from "@capacitor/core";
import { SmsReader } from "../plugins/SmsReaderPlugin";

/**
 * Service for handling SMS permission-related functionality
 */
class SmsPermissionService {
  // Check if we're in a native mobile environment
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Check if SMS permissions are granted
  async hasPermission(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      return false;
    }

    try {
      const result = await SmsReader.checkPermission();
      return result?.granted ?? false;
    } catch (error) {
      console.error("Error checking SMS permission:", error);
      return false;
    }
  }

  // Save permission status to local storage (for web environments)
  savePermissionStatus(granted: boolean): void {
    localStorage.setItem('sms_permission', granted ? 'granted' : 'denied');
  }

  // Request SMS permissions
  async requestPermission(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      // For web testing, simulate granting permission
      this.savePermissionStatus(true);
      return true;
    }

    try {
      const result = await SmsReader.requestPermission();
      const granted = result?.granted ?? false;
      this.savePermissionStatus(granted);
      return granted;
    } catch (error) {
      console.error("Error requesting SMS permission:", error);
      this.savePermissionStatus(false);
      return false;
    }
  }

  // Check if app can read SMS messages
  canReadSms(): boolean {
    if (!this.isNativeEnvironment()) {
      return localStorage.getItem('sms_permission') === 'granted';
    }
    
    return this.hasPermission();
  }
}

export const smsPermissionService = new SmsPermissionService();
