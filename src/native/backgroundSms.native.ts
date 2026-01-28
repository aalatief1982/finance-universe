import { BackgroundSmsListener } from '@/plugins/BackgroundSmsListenerPlugin';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import { Capacitor } from '@capacitor/core';

// Add a small cache and in-flight guard to avoid repeatedly calling native checkPermissionWithRationale
let _lastPermissionCheckTime = 0;
let _lastPermissionCheckResult: { granted: boolean; shouldShowRationale?: boolean } | null = null;
let _permissionCheckInFlight: Promise<any> | null = null;
const PERMISSION_CHECK_CACHE_TTL = 2000; // ms

// Create a wrapper around the actual plugin with better error handling
const BackgroundSmsListenerWrapper: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    try {
      if (import.meta.env.MODE === 'development') {
        // console.log(`[SMS] Adding listener for event: ${eventName}`);
      }
      return await BackgroundSmsListener.addListener(eventName, listenerFunc);
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error(`[SMS] Error adding listener for event ${eventName}:`, err);
      }
      throw err;
    }
  },
  
  checkPermission: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Checking permission');
      }

      // Use cached result if fresh
      const now = Date.now();
      if (_lastPermissionCheckResult && (now - _lastPermissionCheckTime) < PERMISSION_CHECK_CACHE_TTL) {
        return _lastPermissionCheckResult;
      }

      // If an in-flight permission check exists, reuse it
      if (_permissionCheckInFlight) return _permissionCheckInFlight;

      _permissionCheckInFlight = (async () => {
        try {
          const result = await BackgroundSmsListener.checkPermission();
          _lastPermissionCheckResult = result as any;
          _lastPermissionCheckTime = Date.now();
          return result;
        } catch (err) {
          if (import.meta.env.MODE === 'development') {
            console.warn('[SMS] Error checking permission:', err);
          }
          const fallback = { granted: false };
          _lastPermissionCheckResult = fallback;
          _lastPermissionCheckTime = Date.now();
          return fallback;
        } finally {
          _permissionCheckInFlight = null;
        }
      })();

      return _permissionCheckInFlight;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error checking permission:', err);
      }
      return { granted: false };
    }
  },

  checkPermissionWithRationale: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Checking permission with rationale');
      }

      // Use cached result if fresh
      const now = Date.now();
      if (_lastPermissionCheckResult && (now - _lastPermissionCheckTime) < PERMISSION_CHECK_CACHE_TTL) {
        // Ensure returned object has shouldShowRationale
        return { granted: _lastPermissionCheckResult.granted, shouldShowRationale: !!_lastPermissionCheckResult.shouldShowRationale };
      }

      if (_permissionCheckInFlight) return _permissionCheckInFlight;

      _permissionCheckInFlight = (async () => {
        try {
          const result = await BackgroundSmsListener.checkPermissionWithRationale();
          _lastPermissionCheckResult = result as any;
          _lastPermissionCheckTime = Date.now();
          return result;
        } catch (err) {
          if (import.meta.env.MODE === 'development') {
            console.warn('[SMS] Error checking permission rationale:', err);
          }
          const fallback = { granted: false, shouldShowRationale: true };
          _lastPermissionCheckResult = fallback;
          _lastPermissionCheckTime = Date.now();
          return fallback;
        } finally {
          _permissionCheckInFlight = null;
        }
      })();

      return _permissionCheckInFlight;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error checking permission rationale:', err);
      }
      return { granted: false, shouldShowRationale: true };
    }
  },
  
  requestPermission: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Requesting permission');
      }
      const result = await BackgroundSmsListener.requestPermission();
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Permission request result:', result);
      }
      // update cached result
      _lastPermissionCheckResult = result as any;
      _lastPermissionCheckTime = Date.now();
      return result;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error requesting permission:', err);
      }
      // Return a standard response object to avoid further errors
      return { granted: false };
    }
  },
  
  startListening: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Starting to listen for SMS');
      }
      await BackgroundSmsListener.startListening();
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Now listening for SMS');
      }
      return; // Return void as expected
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error starting to listen for SMS:', err);
      }
      // Don't rethrow to avoid app crashing
    }
  },
  
  stopListening: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Stopping listening for SMS');
      }
      await BackgroundSmsListener.stopListening();
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Stopped listening for SMS');
      }
      return; // Return void as expected
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error stopping SMS listener:', err);
      }
      // Don't rethrow to avoid app crashing
    }
  }
};

export default BackgroundSmsListenerWrapper;
