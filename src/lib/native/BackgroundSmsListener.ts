
import { Capacitor } from '@capacitor/core'; 
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

// Cache the listener to avoid multiple instantiations
let backgroundSmsListener: BackgroundSmsListenerPlugin | null = null;

/**
 * Loads the appropriate SMS listener implementation based on platform.
 * Uses error handling to gracefully degrade functionality if issues occur.
 */
export async function loadSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  // Web platform gets a simulated implementation
  if (Capacitor.getPlatform() === 'web') {
    if (import.meta.env.MODE === 'development') {
      // console.log('[SMS] Web platform — Using web implementation');
    }
    try {
      const { default: webListener } = await import('@/native/backgroundSms.web');
      return webListener;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[SMS] Failed to load web SMS listener:', err);
      }
      return null;
    }
  }

  // Native platform
  try {
    if (!backgroundSmsListener) {
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Loading native SMS listener plugin');
      }
      try {
        const { default: nativeListener } = await import('@/native/backgroundSms.native');
        backgroundSmsListener = nativeListener;
        
        if (!backgroundSmsListener) {
          if (import.meta.env.MODE === 'development') {
            console.error('[SMS] Failed to load native SMS listener');
          }
          return null;
        }
        
        if (import.meta.env.MODE === 'development') {
          // console.log('[SMS] SMS listener plugin loaded successfully');
        }
      } catch (err) {
        if (import.meta.env.MODE === 'development') {
          console.error('[SMS] Error loading SMS listener module:', err);
        }
        return null;
      }
    }
    return backgroundSmsListener;
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('[SMS] Failed to load SMS listener:', err);
    }
    return null;
  }
}
