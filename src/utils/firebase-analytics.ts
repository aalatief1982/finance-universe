import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase-config';

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
      // Use web Firebase for web platform
      logEvent(analytics, name, params);
     
        console.log('[FirebaseAnalytics] Web event logged:', name, params);
      
    }
  } catch (err) {
   
      console.warn('[FirebaseAnalytics] logEvent failed:', err);
    
  }
}
