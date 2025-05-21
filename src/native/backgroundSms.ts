
import { Capacitor } from '@capacitor/core';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

export default async function getBackgroundSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  try {
    console.log(`[SMS] Loading listener for platform: ${Capacitor.getPlatform()}`);
    
    if (Capacitor.getPlatform() === 'web') {
      console.log('[SMS] Web platform detected, using web implementation');
      const { default: webListener } = await import('./backgroundSms.web');
      return webListener;
    } else {
      console.log('[SMS] Native platform detected, using native implementation');
      const { default: nativeListener } = await import('./backgroundSms.native');
      return nativeListener;
    }
  } catch (err) {
    console.error('[SMS] Failed to load background SMS listener:', err);
    return null;
  }
}
