
import { Capacitor } from '@capacitor/core'; 
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

let backgroundSmsListener: BackgroundSmsListenerPlugin | null = null;

export async function loadSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  if (Capacitor.getPlatform() === 'web') {
    console.log('[SMS] Web platform — Using web implementation');
    try {
      const { default: webListener } = await import('@/native/backgroundSms.web');
      return webListener;
    } catch (err) {
      console.error('[SMS] Failed to load web SMS listener:', err);
      return null;
    }
  }

  try {
    if (!backgroundSmsListener) {
      console.log('[SMS] Loading native SMS listener plugin');
      try {
        const { default: getListener } = await import('@/native/backgroundSms');
        backgroundSmsListener = await getListener();
        
        // Verify that the required methods exist
        if (!backgroundSmsListener) {
          console.error('[SMS] Failed to load native SMS listener');
          return null;
        }
        
        if (typeof backgroundSmsListener.checkPermission !== 'function') {
          console.warn('[SMS] Plugin loaded but checkPermission method is missing');
        }
        if (typeof backgroundSmsListener.startListening !== 'function') {
          console.warn('[SMS] Plugin loaded but startListening method is missing');
        }
        
        console.log('[SMS] SMS listener plugin loaded successfully');
      } catch (err) {
        console.error('[SMS] Error loading SMS listener module:', err);
        return null;
      }
    }
    return backgroundSmsListener;
  } catch (err) {
    console.error('[SMS] Failed to load SMS listener:', err);
    return null;
  }
}
