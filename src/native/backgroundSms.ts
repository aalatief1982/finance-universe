
import { Capacitor } from '@capacitor/core';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

export default async function getBackgroundSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  try {
    console.log(`[SMS] Loading listener for platform: ${Capacitor.getPlatform()}`);
    
    const module = Capacitor.getPlatform() === 'web'
      ? await import('./backgroundSms.web')
      : await import('./backgroundSms.native');
    
    console.log('[SMS] Module loaded successfully');
    return module.default;
  } catch (err) {
    console.error('[SMS] Failed to load background SMS listener:', err);
    return null;
  }
}
