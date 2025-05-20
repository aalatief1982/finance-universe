
import { Capacitor } from '@capacitor/core';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

export default async function getBackgroundSmsListener(): Promise<BackgroundSmsListenerPlugin | null> {
  try {
    console.log(`[SMS] Loading listener for platform: ${Capacitor.getPlatform()}`);
    
    let module;
    if (Capacitor.getPlatform() === 'web') {
      console.log('[SMS] Web platform detected, using web implementation');
      module = await import('./backgroundSms.web').catch(err => {
        console.error('[SMS] Failed to load web implementation:', err);
        return { default: null };
      });
    } else {
      console.log('[SMS] Native platform detected, using native implementation');
      module = await import('./backgroundSms.native').catch(err => {
        console.error('[SMS] Failed to load native implementation:', err);
        return { default: null };
      });
    }
    
    const listener = module?.default;
    
    if (!listener) {
      console.error('[SMS] Module loaded successfully but no default export found');
      return null;
    }
    
    console.log('[SMS] Module loaded successfully:', listener);
    return listener;
  } catch (err) {
    console.error('[SMS] Failed to load background SMS listener:', err);
    return null;
  }
}
