/**
 * @file useSmsPermission.ts
 * @description Hook for managing SMS permission state with throttled checks.
 *              Provides permission check, request, and revoke functionality.
 *
 * @responsibilities
 * - Track SMS permission state with caching
 * - Throttle native permission checks to prevent bridge flooding
 * - Provide periodic permission sync when app is focused
 * - Handle permission request and revocation flows
 *
 * @dependencies
 * - SmsPermissionService: Native permission bridge
 *
 * @review-checklist
 * - [ ] Permission cache duration prevents excessive native calls
 * - [ ] Focus/blur listeners properly cleaned up
 * - [ ] Interval cleared on blur and unmount
 * - [ ] Force refresh bypasses cache when needed
 *
 * @review-tags
 * - @review-perf: Throttled native bridge calls (30s cache)
 * - @review-focus: Interval management (lines 103-136)
 * - @side-effects: Native bridge calls, interval timers
 */

import { useState, useEffect, useCallback } from 'react';
import { smsPermissionService } from '@/services/SmsPermissionService';

// ============================================================================
// SECTION: Type Definitions
// ============================================================================

interface SmsPermissionState {
  hasPermission: boolean;
  isChecking: boolean;
  lastChecked: number;
}

// ============================================================================
// SECTION: Configuration Constants
// PURPOSE: Throttle native bridge calls to prevent flooding
// REVIEW: Adjust values based on performance profiling
// ============================================================================

/** Interval for periodic permission checks when focused */
const PERMISSION_CHECK_INTERVAL = 5000; // 5 seconds

/** Cache duration before forcing a fresh native check */
const PERMISSION_CACHE_DURATION = 30000; // 30 seconds

// ============================================================================
// SECTION: Permission Hook
// PURPOSE: Manage SMS permission state with throttled native checks
// ============================================================================

export function useSmsPermission() {
  const [state, setState] = useState<SmsPermissionState>({
    hasPermission: false,
    isChecking: false,
    lastChecked: 0,
  });

  // ============================================================================
  // SECTION: Permission Check
  // PURPOSE: Check permission with cache to avoid bridge flooding
  // REVIEW: Force parameter bypasses cache for UI-triggered refreshes
  // ============================================================================

  /**
   * Check SMS permission status with optional cache bypass.
   * Uses cached result if recent to reduce native bridge calls.
   * 
   * @param force - Bypass cache and check native permission
   * @returns Current permission status
   */
  const checkPermission = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    
    // Use cached result if recent and not forced
    if (!force && (now - state.lastChecked) < PERMISSION_CACHE_DURATION) {
      return state.hasPermission;
    }

    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const hasPermission = await smsPermissionService.hasPermission();
      setState({
        hasPermission,
        isChecking: false,
        lastChecked: now,
      });
      return hasPermission;
    } catch (error) {
      console.error('Error checking SMS permission:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, [state.hasPermission, state.lastChecked]);

  // ============================================================================
  // SECTION: Permission Request
  // PURPOSE: Request SMS permission from user
  // REVIEW: Re-checks permission after request to get canonical state
  // ============================================================================

  /**
   * Request SMS permission from the user.
   * After request resolves, re-checks to get canonical state.
   */
  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      const result = await smsPermissionService.requestPermission();
      // After the request resolves, re-check canonical permission state
      // to avoid native inconsistencies
      const hasPermission = await checkPermission(true);
      setState({
        hasPermission: !!hasPermission,
        isChecking: false,
        lastChecked: Date.now(),
      });
      return hasPermission;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, [checkPermission]);

  // ============================================================================
  // SECTION: Permission Revocation
  // PURPOSE: Revoke SMS permission (may require manual action)
  // REVIEW: Returns result object with manual action flag
  // ============================================================================

  /**
   * Revoke SMS permission.
   * May require user to manually revoke in app settings.
   */
  const revokePermission = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const result = await smsPermissionService.revokePermission();
      
      if (result.success) {
        setState({
          hasPermission: false,
          isChecking: false,
          lastChecked: Date.now(),
        });
      } else {
        setState(prev => ({ ...prev, isChecking: false }));
      }
      
      return result;
    } catch (error) {
      console.error('Error revoking SMS permission:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return {
        success: false,
        requiresManualAction: false,
        message: 'Failed to revoke permission',
      };
    }
  }, []);

  const refreshPermission = useCallback(() => {
    return checkPermission(true);
  }, [checkPermission]);

  // Initial permission check on mount
  useEffect(() => {
    checkPermission();
  }, []);

  // ============================================================================
  // SECTION: Periodic Permission Sync
  // PURPOSE: Keep permission state in sync when app is focused
  // REVIEW: Interval must be cleared on blur and unmount
  // @review-focus: Closure captures and cleanup logic
  // ============================================================================

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const handleFocus = () => {
      checkPermission(true);
      
      // Start periodic checks when focused
      intervalId = setInterval(() => {
        checkPermission();
      }, PERMISSION_CHECK_INTERVAL);
    };

    const handleBlur = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Start periodic checks if already focused
    if (document.hasFocus()) {
      handleFocus();
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkPermission]);

  // ============================================================================
  // SECTION: Hook Return
  // ============================================================================

  return {
    hasPermission: state.hasPermission,
    isChecking: state.isChecking,
    checkPermission,
    requestPermission,
    revokePermission,
    refreshPermission,
  };
}
