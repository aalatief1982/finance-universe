
import { Capacitor } from "@capacitor/core";
import { loadSmsListener } from '@/lib/native/BackgroundSmsListener';

/**
 * Service for handling SMS permission-related functionality
 */
class SmsPermissionService {
  private smsListenerInitialized = false;
  
  // Check if we're in a native mobile environment
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Check if SMS permissions are granted
  async hasPermission(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      // For web environments, check local storage
      return localStorage.getItem('sms_permission_simulation') === 'granted';
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
      
      // Initialize listener if permission is granted
      if (granted && !this.smsListenerInitialized) {
        this.initSmsListener();
      }
      
      return granted;
    } catch (error) {
      console.error("[SMS] Error checking SMS permission:", error);
      return false;
    }
  }
  
  // Initialize SMS listener
  async initSmsListener(): Promise<void> {
    if (!this.isNativeEnvironment()) {
      return;
    }
    
    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        return;
      }
      
      await smsListener.startListening();
      this.smsListenerInitialized = true;
      console.log('[SMS] SMS listener initialized');
    } catch (error) {
      console.error("[SMS] Error initializing SMS listener:", error);
    }
  }

  // Save permission status to local storage
  savePermissionStatus(granted: boolean): void {
    if (this.isNativeEnvironment()) {
      localStorage.setItem('sms_permission', granted ? 'granted' : 'denied');
    } else {
      localStorage.setItem('sms_permission_simulation', granted ? 'granted' : 'denied');
    }
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
      
      // Initialize listener if permission is granted
      if (granted) {
        this.initSmsListener();
      }
      
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
      return localStorage.getItem('sms_permission_simulation') === 'granted';
    }
    
    // For native environments, we'll use the cached value
    return localStorage.getItem('sms_permission') === 'granted';
  }
}

export const smsPermissionService = new SmsPermissionService();
