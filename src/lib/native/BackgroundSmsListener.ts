import { Capacitor } from '@capacitor/core';

export async function loadSmsListener() {
  const platform = Capacitor.getPlatform();

  if (platform === 'web') {
    console.log('[SMS] Web platform — skipping plugin load.');
    return null;
  }

  try {
    const mod = await import(/* @vite-ignore */ 'capacitor-background-sms-listener');

    const plugin = mod?.BackgroundSmsListener || mod?.default;

    if (!plugin) {
      console.warn('[Native Load Warning] Plugin loaded but no export found.');
      return null;
    }

    console.log('[SMS] Native plugin loaded:', plugin);
    return plugin;
  } catch (err) {
    console.warn('[Native Load Warning] SMS plugin failed to load:', err);
    return null;
  }
}
