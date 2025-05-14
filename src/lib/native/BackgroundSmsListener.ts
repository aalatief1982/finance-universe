
import { Capacitor } from '@capacitor/core';

export async function loadSmsListener() {
  const platform = Capacitor.getPlatform();

  if (platform === 'web') {
    console.log('[SMS] Web platform — skipping plugin load.');
    return null;
  }

  try {
    // Import the plugin directly to avoid dynamic import issues
    const { BackgroundSmsListener } = await import('@/plugins/BackgroundSmsListenerPlugin');
    
    if (!BackgroundSmsListener) {
      console.warn('[Native Load Warning] Plugin loaded but no export found.');
      return null;
    }

    console.log('[SMS] Native plugin loaded:', BackgroundSmsListener);
    return BackgroundSmsListener;
  } catch (err) {
    console.error('[Native Load Warning] SMS plugin failed to load:', err);
    return null;
  }
}
