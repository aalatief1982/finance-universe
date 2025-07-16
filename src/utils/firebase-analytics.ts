import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Device } from '@capacitor/device';
import { logToGoogleSheets } from './google-sheets';

/**
 * Safely log a Firebase Analytics event on both native and web platforms.
 * Also logs to Google Sheets with device information.
 * Errors are silently ignored unless in development mode.
 */
export async function logAnalyticsEvent(name: string, params?: Record<string, any>) {
  try {
    // Get device information for Google Sheets logging
    const deviceInfo = await Device.getInfo();
    const deviceId = await Device.getId();
    
    // Log to Firebase Analytics
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor plugin for native platforms
      await FirebaseAnalytics.logEvent({ name, params });
      
        console.log('[FirebaseAnalytics] Native event logged:', name, params);
      
    } else {
      // For web platform, use native console logging only
      console.log('[FirebaseAnalytics] Web platform - event would be:', name, params);
    }

    // Log to Google Sheets
    await logToGoogleSheets({
      deviceId: deviceId.identifier,
      event: name,
      parameters: JSON.stringify(params || {}),
      date: new Date().toISOString(),
      osVersion: `${deviceInfo.platform} ${deviceInfo.osVersion}`
    });
    
  } catch (err) {
   
      console.warn('[FirebaseAnalytics] logEvent failed:', err);
    
  }
}
