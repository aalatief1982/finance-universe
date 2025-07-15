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
      if (import.meta.env.MODE === 'development') {
        console.log('[FirebaseAnalytics] Native event logged:', name, params);
      }
    } else {
      // Use web Firebase for web platform
      logEvent(analytics, name, params);
      if (import.meta.env.MODE === 'development') {
        console.log('[FirebaseAnalytics] Web event logged:', name, params);
      }
    }
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.warn('[FirebaseAnalytics] logEvent failed:', err);
    }
  }
}
