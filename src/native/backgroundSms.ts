
import { Capacitor } from '@capacitor/core';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

export default async function getBackgroundSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  try {
    if (import.meta.env.MODE === 'development') {
      console.log(`[SMS] Loading listener for platform: ${Capacitor.getPlatform()}`);
    }
    
    if (Capacitor.getPlatform() === 'web') {
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Web platform detected, using web implementation');
      }
      const { default: webListener } = await import('./backgroundSms.web');
      return webListener;
    } else {
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Native platform detected, using native implementation');
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
