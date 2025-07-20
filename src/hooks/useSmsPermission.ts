import { useState, useEffect, useCallback } from 'react';
import { smsPermissionService } from '@/services/SmsPermissionService';

interface SmsPermissionState {
  hasPermission: boolean;
  isChecking: boolean;
  lastChecked: number;
}

const PERMISSION_CHECK_INTERVAL = 5000; // 5 seconds
const PERMISSION_CACHE_DURATION = 30000; // 30 seconds

export function useSmsPermission() {
  const [state, setState] = useState<SmsPermissionState>({
    hasPermission: false,
    isChecking: false,
    lastChecked: 0,
  });

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

  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const granted = await smsPermissionService.requestPermission();
      setState({
        hasPermission: granted,
        isChecking: false,
        lastChecked: Date.now(),
      });
      return granted;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, []);

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

  // Initial permission check
  useEffect(() => {
    checkPermission();
  }, []);

  // Periodic permission sync when app is focused
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

  return {
    hasPermission: state.hasPermission,
    isChecking: state.isChecking,
    checkPermission,
    requestPermission,
    revokePermission,
    refreshPermission,
  };
}