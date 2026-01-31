
/**
 * @file backgroundSms.ts
 * @description Loads the appropriate background SMS listener implementation
 *              based on the current platform (web vs native).
 *
 * @responsibilities
 * - Detect platform at runtime
 * - Dynamically import the correct plugin implementation
 * - Surface load failures to callers by returning null
 *
 * @dependencies
 * - BackgroundSmsListenerPlugin: native/web plugin interface
 *
 * @review-tags
 * - @error-handling: failed imports should be logged in development only
 * - @platform: ensure platform detection remains consistent with Capacitor
 *
 * @review-checklist
 * - [ ] Web platform loads backgroundSms.web implementation
 * - [ ] Native platforms load backgroundSms.native implementation
 */
import { Capacitor } from '@capacitor/core';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

export default async function getBackgroundSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  // ============================================================================
  // SECTION: Platform Resolution
  // PURPOSE: Select the correct implementation for the current platform
  // REVIEW: Ensure platform checks remain consistent with Capacitor
  // ============================================================================
  try {
    if (import.meta.env.MODE === 'development') {
      // console.log(`[SMS] Loading listener for platform: ${Capacitor.getPlatform()}`);
    }
    
    if (Capacitor.getPlatform() === 'web') {
      // Web implementation (no native plugin available)
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Web platform detected, using web implementation');
      }
      const { default: webListener } = await import('./backgroundSms.web');
      return webListener;
    } else {
      // Native implementation (Android/iOS)
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Native platform detected, using native implementation');
      }
      const { default: nativeListener } = await import('./backgroundSms.native');
      return nativeListener;
    }
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('[SMS] Failed to load background SMS listener:', err);
    }
    return null;
  }
}
