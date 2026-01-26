
import { safeStorage } from "@/utils/safe-storage";
import { setSmsPermissionGrantDate } from "@/utils/sms-permission-storage";

import { Capacitor } from "@capacitor/core";
import { loadSmsListener } from '@/lib/native/BackgroundSmsListener';
import { SmsReaderService } from './SmsReaderService';

/**
 * Service for handling SMS permission-related functionality
 */
export interface SmsPermissionCheckResult {
  granted: boolean;
  shouldShowRationale: boolean;
  permanentlyDenied: boolean;
}

export interface SmsPermissionRequestResult {
  granted: boolean;
  permanentlyDenied: boolean;
}

class SmsPermissionService {
  private smsListenerInitialized = false;

  private combinePermissionStatuses(
    readerStatus: { granted: boolean; shouldShowRationale: boolean },
    listenerStatus: { granted: boolean; shouldShowRationale: boolean }
  ): SmsPermissionCheckResult {
    const granted = readerStatus.granted && listenerStatus.granted;
    const shouldShowRationale =
      readerStatus.shouldShowRationale || listenerStatus.shouldShowRationale;
    return {
      granted,
      shouldShowRationale,
      permanentlyDenied: !granted && !shouldShowRationale,
    };
  }
  
  // Check if we're in a native mobile environment
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }

  async checkPermissionStatus(): Promise<SmsPermissionCheckResult> {
    if (!this.isNativeEnvironment()) {
      const granted = safeStorage.getItem('sms_permission_simulation') === 'granted';
      return {
        granted,
        shouldShowRationale: !granted,
        permanentlyDenied: false,
      };
    }

    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Failed to load SMS listener when checking permissions');
        }
        return {
          granted: false,
          shouldShowRationale: true,
          permanentlyDenied: false,
        };
      }

      const [readerStatus, listenerStatus] = await Promise.all([
        SmsReaderService.checkPermissionWithRationale(),
        smsListener.checkPermissionWithRationale(),
      ]);

      return this.combinePermissionStatuses(readerStatus, listenerStatus);
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error checking SMS permission:", error);
      }
      return {
        granted: false,
        shouldShowRationale: true,
        permanentlyDenied: false,
      };
    }
  }

  // Check if SMS permissions are granted
  async hasPermission(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      // For web environments, check local storage
      return safeStorage.getItem('sms_permission_simulation') === 'granted';
    }

    try {
      const status = await this.checkPermissionStatus();
      this.savePermissionStatus(status.granted);

      // Initialize listener only when both permissions are granted
      if (status.granted && !this.smsListenerInitialized) {
        this.initSmsListener();
      }

      return status.granted;
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
        // console.log('[SMS] SMS listener initialized');
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
  async requestPermission(): Promise<SmsPermissionRequestResult> {
    if (!this.isNativeEnvironment()) {
      // For web testing, simulate granting permission
      this.savePermissionStatus(true);
      // Record the grant date for web simulation
      setSmsPermissionGrantDate(new Date().toISOString());
      return { granted: true, permanentlyDenied: false };
    }

    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Failed to load SMS listener when requesting permissions');
        }
        return { granted: false, permanentlyDenied: false };
      }

      // Check if permission was already granted before (lightweight cached check)
      const cachedPermissionGranted = safeStorage.getItem('sms_permission') === 'granted';
      const readerPermissionGranted = await SmsReaderService.hasPermission();
      const wasAlreadyGranted = cachedPermissionGranted || readerPermissionGranted;

      // Request permissions sequentially to avoid Android dialog collisions.
      const readerGranted = await SmsReaderService.requestPermission();
      if (!readerGranted) {
        this.savePermissionStatus(false);
        const readerStatus = await SmsReaderService.checkPermissionWithRationale();
        return {
          granted: false,
          permanentlyDenied: !readerStatus.granted && !readerStatus.shouldShowRationale,
        };
      }

      const listenerResult = await smsListener.requestPermission();
      const listenerGranted = listenerResult?.granted ?? false;
      if (!listenerGranted) {
        this.savePermissionStatus(false);
        const listenerStatus = await smsListener.checkPermissionWithRationale();
        return {
          granted: false,
          permanentlyDenied: !listenerStatus.granted && !listenerStatus.shouldShowRationale,
        };
      }

      const granted = true;
      this.savePermissionStatus(granted);

      // Record the grant date only if this is a new grant (not already granted)
      if (granted && !wasAlreadyGranted) {
        setSmsPermissionGrantDate(new Date().toISOString());
      }

      // Initialize listener only when both permissions are granted
      if (granted) {
        this.initSmsListener();
      }

      return { granted, permanentlyDenied: false };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error requesting SMS permission:", error);
      }
      this.savePermissionStatus(false);
      return { granted: false, permanentlyDenied: false };
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

  // Revoke SMS permissions (web only - native requires manual action)
  async revokePermission(): Promise<{ success: boolean; requiresManualAction: boolean; message: string }> {
    if (!this.isNativeEnvironment()) {
      // For web environments, simulate revoking permission
      this.savePermissionStatus(false);
      return {
        success: true,
        requiresManualAction: false,
        message: 'SMS permission revoked successfully'
      };
    }

    // For native platforms, permissions cannot be revoked programmatically
    return {
      success: false,
      requiresManualAction: true,
      message: 'To disable SMS permissions, please go to your device Settings > Apps > Xpensia > Permissions and disable SMS access manually.'
    };
  }
}

export const smsPermissionService = new SmsPermissionService();
