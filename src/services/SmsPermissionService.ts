import { safeStorage } from "@/utils/safe-storage";

import { Capacitor } from "@capacitor/core";
import { loadSmsListener } from '@/lib/native/BackgroundSmsListener';
import { SmsReaderService } from './SmsReaderService';

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
      return safeStorage.getItem('sms_permission_simulation') === 'granted';
    }

    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Failed to load SMS listener when checking permissions');
        }
        return false;
      }

      // Check permission for both the reader and background listener
      const [readerGranted, listenerResult] = await Promise.all([
        SmsReaderService.hasPermission(),
        smsListener.checkPermission(),
      ]);

      const listenerGranted = listenerResult?.granted ?? false;
      const granted = readerGranted && listenerGranted;
      this.savePermissionStatus(granted);

      // Initialize listener only when both permissions are granted
      if (granted && !this.smsListenerInitialized) {
        this.initSmsListener();
      }

      return granted;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error checking SMS permission:", error);
      }
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
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] SMS listener initialized');
      }
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error initializing SMS listener:", error);
      }
    }
  }

  // Save permission status to local storage
  savePermissionStatus(granted: boolean): void {
    if (this.isNativeEnvironment()) {
      safeStorage.setItem('sms_permission', granted ? 'granted' : 'denied');
    } else {
      safeStorage.setItem('sms_permission_simulation', granted ? 'granted' : 'denied');
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
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Failed to load SMS listener when requesting permissions');
        }
        return false;
      }

      // Request permission from both plugins
      const [readerGranted, listenerResult] = await Promise.all([
        SmsReaderService.requestPermission(),
        smsListener.requestPermission(),
      ]);

      const listenerGranted = listenerResult?.granted ?? false;
      const granted = readerGranted && listenerGranted;
      this.savePermissionStatus(granted);

      // Initialize listener only when both permissions are granted
      if (granted) {
        this.initSmsListener();
      }

      return granted;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error requesting SMS permission:", error);
      }
      this.savePermissionStatus(false);
      return false;
    }
  }

  // Check if app can read SMS messages
  canReadSms(): boolean {
    if (!this.isNativeEnvironment()) {
      return safeStorage.getItem('sms_permission_simulation') === 'granted';
    }
    
    // For native environments, we'll use the cached value
    return safeStorage.getItem('sms_permission') === 'granted';
  }
}

export const smsPermissionService = new SmsPermissionService();
