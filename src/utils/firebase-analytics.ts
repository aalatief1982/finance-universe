import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Device } from '@capacitor/device';
import { logToGoogleSheets } from './google-sheets';

/**
 * Log to Firebase Analytics only (no Google Sheets).
 * Use for high-frequency events like screen views to avoid excessive API calls.
 */
export async function logFirebaseOnlyEvent(name: string, params?: Record<string, any>) {
  try {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAnalytics.logEvent({ name, params });
      if (import.meta.env.MODE === 'development') {
        // console.log('[FirebaseAnalytics] Native event logged:', name, params);
      }
    } else {
      if (import.meta.env.MODE === 'development') {
        // console.log('[FirebaseAnalytics] Web platform - event would be:', name, params);
      }
    }
  } catch (err) {
    console.warn('[FirebaseAnalytics] logFirebaseOnlyEvent failed:', err);
  }
}

/**
 * Log to Google Sheets only (no Firebase).
 * Use for detailed debugging data like template matches and errors.
 */
export async function logSheetsOnlyEvent(name: string, params?: Record<string, any>) {
  // Skip in test environment
  if (import.meta.env.MODE === 'test') return;
  
  try {
    const deviceInfo = await Device.getInfo();
    
    const logEntry = {
      deviceName: deviceInfo.name || 'Unknown Device',
      event: name,
      parameters: JSON.stringify(params || {}),
      date: new Date().toISOString(),
      osVersion: `${deviceInfo.platform} ${deviceInfo.osVersion}`
    };

    await logToGoogleSheets(logEntry);
  } catch (err) {
    console.warn('[GoogleSheets] logSheetsOnlyEvent failed:', err);
  }
}

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

        if (import.meta.env.MODE === 'development') {
          // console.log('[FirebaseAnalytics] Native event logged:', name, params);
        }
      
    } else {
      // For web platform, use native console logging only
      if (import.meta.env.MODE === 'development') {
        // console.log('[FirebaseAnalytics] Web platform - event would be:', name, params);
      }
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
    if (name === 'transaction_add' || name === 'edit_transaction') {
      const keywordBank = localStorage.getItem('xpensia_keyword_bank');
      logEntry.keywordBank = keywordBank || '';
    }

    await logToGoogleSheets(logEntry);
    
  } catch (err) {
   
      console.warn('[FirebaseAnalytics] logEvent failed:', err);
    
  }
}
