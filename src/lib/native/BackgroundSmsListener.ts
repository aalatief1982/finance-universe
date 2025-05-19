
import { Capacitor } from '@capacitor/core'; 
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

let backgroundSmsListener: BackgroundSmsListenerPlugin | null = null;

export async function loadSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  if (Capacitor.getPlatform() === 'web') {
    console.log('[SMS] Web platform — skipping plugin load.');
    return null;
  }

  try {
    if (!backgroundSmsListener) {
      console.log('[SMS] Loading native SMS listener plugin');
      try {
        const { default: listener } = await import('@/native/backgroundSms');
        backgroundSmsListener = listener;
        
        // Verify that the required methods exist
        if (typeof backgroundSmsListener?.checkPermission !== 'function') {
          console.warn('[SMS] Plugin loaded but checkPermission method is missing');
        }
        if (typeof backgroundSmsListener?.startListening !== 'function') {
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
