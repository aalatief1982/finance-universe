
import { safeStorage } from "@/utils/safe-storage";
import { setSmsPermissionGrantDate } from "@/utils/sms-permission-storage";
import { permissionEventManager, type PermissionStatus } from "@/utils/permission-events";

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
    if (import.meta.env.MODE === 'development') {
      console.log('[SmsPermissionService]: checking permission...');
    }

    if (!this.isNativeEnvironment()) {
      // For web environments, check local storage
      const granted = safeStorage.getItem('sms_permission_simulation') === 'granted';
      return granted;
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
      
      if (import.meta.env.MODE === 'development') {
        console.log(`[SmsPermissionService]: permission granted: ${granted}`);
      }

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

  // Check if we can request permission (not in "never ask again" state)
  async canRequestPermission(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      return true;
    }

    // Check if permission was previously denied with "never ask again"
    const permissionState = permissionEventManager.getPermissionState('sms');
    if (permissionState?.status === 'never-ask-again') {
      return false;
    }

    // For Android, we need to check if we can show the permission dialog
    return true; // This would need native implementation to check shouldShowRequestPermissionRationale
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
  savePermissionStatus(granted: boolean, status?: PermissionStatus): void {
    const permissionStatus: PermissionStatus = status || (granted ? 'granted' : 'denied');
    
    if (import.meta.env.MODE === 'development') {
      console.log(`[SmsPermissionService]: setPermissionState(${permissionStatus})`);
    }

    if (this.isNativeEnvironment()) {
      safeStorage.setItem('sms_permission', granted ? 'granted' : 'denied');
      safeStorage.setItem('sms_permission_status', permissionStatus);
    } else {
      safeStorage.setItem('sms_permission_simulation', granted ? 'granted' : 'denied');
    }
    
    // Emit permission change event with detailed status
    permissionEventManager.emit('sms-permission-changed', granted, permissionStatus);
  }

  // Request SMS permissions
  async requestPermission(): Promise<boolean> {
    if (import.meta.env.MODE === 'development') {
      console.log('[SmsPermissionService]: requestPermission() called');
    }

    if (!this.isNativeEnvironment()) {
      // For web testing, simulate granting permission
      this.savePermissionStatus(true, 'granted');
      setSmsPermissionGrantDate(new Date().toISOString());
      return true;
    }

    // Check if we can request permission
    const canRequest = await this.canRequestPermission();
    if (!canRequest) {
      this.savePermissionStatus(false, 'never-ask-again');
      return false;
    }

    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Failed to load SMS listener when requesting permissions');
        }
        this.savePermissionStatus(false, 'denied');
        return false;
      }

      // Check if permission was already granted before
      const wasAlreadyGranted = await this.hasPermission();
      if (wasAlreadyGranted) {
        return true;
      }

      // Request permission sequentially to avoid conflicts
      const readerGranted = await SmsReaderService.requestPermission();
      if (!readerGranted) {
        this.savePermissionStatus(false, 'denied');
        return false;
      }

      const listenerResult = await smsListener.requestPermission();
      const listenerGranted = listenerResult?.granted ?? false;
      
      const granted = readerGranted && listenerGranted;
      
      if (import.meta.env.MODE === 'development') {
        console.log("[SMS] Permission request result:", { readerGranted, listenerGranted, granted });
      }
      
      // Determine the permission status
      let status: PermissionStatus = 'denied';
      if (granted) {
        status = 'granted';
      } else {
        // This is where we'd check if it's "never ask again" - for now, assume it's just denied
        status = 'denied';
      }

      this.savePermissionStatus(granted, status);

      // Record the grant date only if this is a new grant
      if (granted && !wasAlreadyGranted) {
        setSmsPermissionGrantDate(new Date().toISOString());
      }

      // Initialize listener only when both permissions are granted
      if (granted) {
        this.initSmsListener();
      }

      return granted;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error requesting SMS permission:", error);
      }
      this.savePermissionStatus(false, 'denied');
      return false;
    }
  }

  // Check if app can read SMS messages
  canReadSms(): boolean {
    if (!this.isNativeEnvironment()) {
      return safeStorage.getItem('sms_permission_simulation') === 'granted';
    }
    
    return safeStorage.getItem('sms_permission') === 'granted';
  }

  // Get current permission status
  getPermissionStatus(): PermissionStatus {
    if (!this.isNativeEnvironment()) {
      const granted = safeStorage.getItem('sms_permission_simulation') === 'granted';
      return granted ? 'granted' : 'not-requested';
    }

    const status = safeStorage.getItem('sms_permission_status') as PermissionStatus;
    return status || 'not-requested';
  }

  // Open app settings for manual permission enabling
  async openAppSettings(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      return false;
    }

    try {
      // This would need a native implementation
      // For now, just return false
      return false;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error opening app settings:", error);
      }
      return false;
    }
  }

  // Revoke SMS permissions (web only - native requires manual action)
  async revokePermission(): Promise<{ success: boolean; requiresManualAction: boolean; message: string }> {
    if (!this.isNativeEnvironment()) {
      this.savePermissionStatus(false, 'denied');
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
