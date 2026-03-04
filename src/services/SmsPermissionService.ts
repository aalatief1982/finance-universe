/**
 * @file SmsPermissionService.ts
 * @description Handles SMS permission checks and requests across
 *              reader and background listener plugins.
 *
 * @module services/SmsPermissionService
 *
 * @responsibilities
 * 1. Aggregate permission status from reader and listener plugins
 * 2. Serialize permission checks/requests to avoid flooding native APIs
 * 3. Persist permission grant timestamps
 *
 * @storage-keys
 * - sms_permission_simulation: web-only permission override
 *
 * @dependencies
 * - SmsReaderService.ts: permission status
 * - BackgroundSmsListener: listener permission status
 * - sms-permission-storage.ts: grant date persistence
 *
 * @review-tags
 * - @platform: native permission flows
 * - @risk: cached permission status and in-flight requests
 *
 * @review-checklist
 * - [ ] Concurrent checks reuse cached status
 * - [ ] Request flow updates grant date on success
 * - [ ] Web simulation flag is respected
 */

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

  // Guard to avoid concurrent permission status checks
  private permissionCheckInProgress = false;
  private lastPermissionStatus: SmsPermissionCheckResult | null = null;

  // Serialize permission requests so multiple callers reuse the same in-flight promise
  private permissionRequestPromise: Promise<SmsPermissionRequestResult> | null = null;

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
      const result = {
        granted,
        shouldShowRationale: !granted,
        permanentlyDenied: false,
      };
      // update cached status
      this.lastPermissionStatus = result;
      return result;
    }

    // If a check is already in progress, return last known status immediately to avoid flooding native
    if (this.permissionCheckInProgress) {
      if (this.lastPermissionStatus) return this.lastPermissionStatus;
      // Fallback conservative response
      return { granted: false, shouldShowRationale: true, permanentlyDenied: false };
    }

    this.permissionCheckInProgress = true;
    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Failed to load SMS listener when checking permissions');
        }
        const fallback = {
          granted: false,
          shouldShowRationale: true,
          permanentlyDenied: false,
        };
        this.lastPermissionStatus = fallback;
        return fallback;
      }

      const [readerStatus, listenerStatus] = await Promise.all([
        SmsReaderService.checkPermissionWithRationale(),
        smsListener.checkPermissionWithRationale(),
      ]);

      const combined = this.combinePermissionStatuses(readerStatus, listenerStatus);
      this.lastPermissionStatus = combined;
      return combined;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error("[SMS] Error checking SMS permission:", error);
      }
      const fallback = {
        granted: false,
        shouldShowRationale: true,
        permanentlyDenied: false,
      };
      this.lastPermissionStatus = fallback;
      return fallback;
    } finally {
      this.permissionCheckInProgress = false;
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

      // Initialize listener only when both permissions are granted and not already initialized
      if (status.granted && !this.smsListenerInitialized) {
        // ensure init runs only once
        await this.initSmsListener();
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
    console.log('[SMS_INIT] initSmsListener invoked (listener-only path; no inbox import)');

    if (!this.isNativeEnvironment()) {
      console.log('[SMS_INIT] initSmsListener skipped (non-native environment)');
      return;
    }

    // Throttle initialization so it only runs once
    if (this.smsListenerInitialized) {
      console.log('[SMS_INIT] initSmsListener skipped (already initialized)');
      return;
    }
    
    try {
      const smsListener = await loadSmsListener();
      if (!smsListener) {
        return;
      }
      await smsListener.startListening();
      this.smsListenerInitialized = true;
      console.log('[SMS_INIT] initSmsListener completed (listener active; no bulk import)');
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
    // If a request is already in-flight, return that promise so callers share it
    if (this.permissionRequestPromise) return this.permissionRequestPromise;

    // Create and store the in-flight promise
    this.permissionRequestPromise = (async (): Promise<SmsPermissionRequestResult> => {
      if (!this.isNativeEnvironment()) {
        // For web testing, simulate granting permission
        this.savePermissionStatus(true);
        // Record the grant date for web simulation
        setSmsPermissionGrantDate(new Date().toISOString());
        this.permissionRequestPromise = null;
        return { granted: true, permanentlyDenied: false };
      }

      // Helper to add a per-call timeout to native requests
      const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T | { __timedOut: true }> => {
        let timedOut = false;
        const timer = new Promise(resolve => setTimeout(() => { timedOut = true; resolve({ __timedOut: true }); }, ms));
        try {
        const res = await Promise.race([p, timer]);
          if (res && typeof res === 'object' && '__timedOut' in res) {
            return { __timedOut: true } as T & { __timedOut: true };
          }
          return res as T;
        } catch {
          return { __timedOut: true } as T & { __timedOut: true };
        }
      };

      try {
        const smsListener = await loadSmsListener();
        if (!smsListener) {
          if (import.meta.env.MODE === 'development') {
            console.warn('[SMS] Failed to load SMS listener when requesting permissions');
          }
          this.permissionRequestPromise = null;
          return { granted: false, permanentlyDenied: false };
        }

        // Lightweight cached check
        const cachedPermissionGranted = safeStorage.getItem('sms_permission') === 'granted';
        const readerPermissionGranted = await SmsReaderService.hasPermission();
        const wasAlreadyGranted = cachedPermissionGranted || readerPermissionGranted;

        // Request reader and listener permissions in parallel
        await Promise.all([
          withTimeout(SmsReaderService.requestPermission(), 8000),
          withTimeout(smsListener.requestPermission(), 8000),
        ]);

        // Immediate check — if already granted, skip polling entirely
        let finalStatus = await this.checkPermissionStatus();

        if (!finalStatus.granted && !finalStatus.permanentlyDenied) {
          // Poll for definitive permission state
          const POLL_INTERVAL_MS = 1000;
          const POLL_TIMEOUT_MS = 10000;
          const maxRetries = Math.ceil(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);

          let attempt = 0;
          while (!finalStatus.granted && !finalStatus.permanentlyDenied && attempt < maxRetries) {
            if (finalStatus.shouldShowRationale) break;
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
            finalStatus = await this.checkPermissionStatus();
            attempt += 1;
          }
        }

        const granted = !!finalStatus.granted;
        this.savePermissionStatus(granted);

        if (granted && !wasAlreadyGranted) {
          setSmsPermissionGrantDate(new Date().toISOString());
        }

        if (granted) {
          // Initialize listener when granted (initSmsListener itself throttles multiple inits)
          await this.initSmsListener();
        }

        this.permissionRequestPromise = null;
        return { granted, permanentlyDenied: !!finalStatus.permanentlyDenied };
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error("[SMS] Error requesting SMS permission:", error);
        }
        this.savePermissionStatus(false);
        this.permissionRequestPromise = null;
        return { granted: false, permanentlyDenied: false };
      }
    })();

    return this.permissionRequestPromise;
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
