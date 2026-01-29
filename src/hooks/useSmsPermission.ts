import { useEffect, useRef, useState, useCallback } from 'react';
import { smsPermissionService } from '@/services/SmsPermissionService';

export interface UseSmsPermissionResult {
  hasPermission: boolean;
  refreshPermission: () => void;
}

export function useSmsPermission(): UseSmsPermissionResult {
  const [granted, setGranted] = useState(false);
  const lastCheckedRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const check = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckedRef.current < 30000) return; // 30s min interval
    lastCheckedRef.current = now;
    setGranted(await smsPermissionService.hasPermission());
  }, []);

  const refreshPermission = useCallback(() => {
    lastCheckedRef.current = 0; // Reset throttle to allow immediate check
    check();
  }, [check]);

  useEffect(() => {
    check(); // immediate check
    const handleFocus = () => {
      lastCheckedRef.current = 0; // Allow check on focus
      check();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(check, 60000); // 60s interval
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  return { hasPermission: granted, refreshPermission };
}
