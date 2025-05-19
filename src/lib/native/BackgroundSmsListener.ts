
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
      const { default: listener } = await import('@/native/backgroundSms');
      backgroundSmsListener = listener;
      console.log('[SMS] SMS listener plugin loaded successfully');
    }
    return backgroundSmsListener;
  } catch (err) {
    console.error('[SMS] Failed to load SMS listener:', err);
    return null;
  }
}
