
import { Capacitor } from "@capacitor/core";
import { loadSmsListener } from '@/lib/native/BackgroundSmsListener';

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
      // For web environments, check local storage
      return localStorage.getItem('sms_permission') === 'granted';
    }

    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        console.warn('[SMS] Failed to load SMS listener when checking permissions');
        return false;
      }
      
      const result = await smsListener.checkPermission();
      const granted = result?.granted ?? false;
      this.savePermissionStatus(granted);
      return granted;
    } catch (error) {
      console.error("[SMS] Error checking SMS permission:", error);
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
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        console.warn('[SMS] Failed to load SMS listener when requesting permissions');
        return false;
      }
      
      const result = await smsListener.requestPermission();
      const granted = result?.granted ?? false;
      this.savePermissionStatus(granted);
      return granted;
    } catch (error) {
      console.error("[SMS] Error requesting SMS permission:", error);
      this.savePermissionStatus(false);
      return false;
    }
  }

  // Check if app can read SMS messages
  canReadSms(): boolean {
    if (!this.isNativeEnvironment()) {
      return localStorage.getItem('sms_permission') === 'granted';
    }
    
    // For native environments, we'd need to make an async check
    // but since this method is sync, we'll use the cached value
    return localStorage.getItem('sms_permission') === 'granted';
  }
}

export const smsPermissionService = new SmsPermissionService();
