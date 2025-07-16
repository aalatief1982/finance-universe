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
    const logEntry: any = {
      deviceName: deviceInfo.name || 'Unknown Device',
      event: name,
      parameters: JSON.stringify(params || {}),
      date: new Date().toISOString(),
      osVersion: `${deviceInfo.platform} ${deviceInfo.osVersion}`
    };

    // For transaction saves, include keyword bank data
    if (name === 'transaction_add' || name === 'transaction_update') {
      const keywordBank = localStorage.getItem('xpensia_keyword_bank');
      logEntry.keywordBank = keywordBank || '';
    }

    await logToGoogleSheets(logEntry);
    
  } catch (err) {
   
      console.warn('[FirebaseAnalytics] logEvent failed:', err);
    
  }
}
