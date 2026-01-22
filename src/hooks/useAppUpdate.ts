import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { appUpdateService, UpdateStatus } from '@/services/AppUpdateService';

interface UseAppUpdateOptions {
  checkOnMount?: boolean;
  checkInterval?: number; // in milliseconds, 0 to disable
}

export const useAppUpdate = (options: UseAppUpdateOptions = {}) => {
  const { checkOnMount = true, checkInterval = 0 } = options;
  
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const checkForUpdates = useCallback(async (silent = false) => {
    // Only check on native platforms
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    setIsChecking(true);

    try {
      const status = await appUpdateService.checkForUpdates();
      setUpdateStatus(status);

      if (status.available && !silent) {
        setShowDialog(true);
      }

      return status;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[useAppUpdate] Check failed:', err);
      }
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    if (checkOnMount && Capacitor.isNativePlatform()) {
      // Delay initial check to not block app startup
      const timer = setTimeout(() => {
        checkForUpdates(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [checkOnMount, checkForUpdates]);

  // Periodic check
  useEffect(() => {
    if (checkInterval > 0 && Capacitor.isNativePlatform()) {
      const interval = setInterval(() => {
        checkForUpdates(true); // Silent check
      }, checkInterval);

      return () => clearInterval(interval);
    }
  }, [checkInterval, checkForUpdates]);

  const dismissUpdate = useCallback(() => {
    setShowDialog(false);
  }, []);

  const openUpdateDialog = useCallback(() => {
    if (updateStatus?.available) {
      setShowDialog(true);
    }
  }, [updateStatus]);

  return {
    updateStatus,
    isChecking,
    showDialog,
    setShowDialog,
    checkForUpdates,
    dismissUpdate,
    openUpdateDialog
  };
};
