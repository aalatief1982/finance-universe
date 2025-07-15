import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

/**
 * Safely log a Firebase Analytics event on both native and web platforms.
 * Errors are silently ignored unless in development mode.
 */
export async function logAnalyticsEvent(name: string, params?: Record<string, any>) {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor plugin for native platforms
      await FirebaseAnalytics.logEvent({ name, params });
      
        console.log('[FirebaseAnalytics] Native event logged:', name, params);
      
    } else {
      // For web platform, use native console logging only
      console.log('[FirebaseAnalytics] Web platform - event would be:', name, params);
    }
  } catch (err) {
   
      console.warn('[FirebaseAnalytics] logEvent failed:', err);
    
  }
}
