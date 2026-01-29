import { useEffect, useRef, useState } from 'react';
import { smsPermissionService } from '@/services/SmsPermissionService';

export function useSmsPermission() {
  const [granted, setGranted] = useState(false);
  const lastCheckedRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const check = async () => {
    const now = Date.now();
    if (now - lastCheckedRef.current < 30000) return; // 30s min interval
    lastCheckedRef.current = now;
    setGranted(await smsPermissionService.hasPermission());
  };

  useEffect(() => {
    check(); // immediate check
    const handleFocus = () => {
      check();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(check, 60000); // 60s interval
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return granted;
}
