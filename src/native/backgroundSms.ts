import { Capacitor } from '@capacitor/core';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

export default async function getBackgroundSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  try {
    const module = Capacitor.getPlatform() === 'web'
      ? await import('./backgroundSms.web')
      : await import('./backgroundSms.native');
    
    return module.default;
  } catch (err) {
    console.error('[SMS] Failed to load background SMS listener:', err);
    return null;
  }
}
