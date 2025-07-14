import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

/**
 * Safely log a Firebase Analytics event when running on a native platform.
 * Errors are silently ignored unless in development mode.
 */
export async function logAnalyticsEvent(name: string, params?: Record<string, any>) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await FirebaseAnalytics.logEvent({ name, params });
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.warn('[FirebaseAnalytics] logEvent failed:', err);
    }
  }
}
