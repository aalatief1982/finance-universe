/**
 * @file app-mode.ts
 * @description Utility for managing the app's demo vs real data mode.
 *
 * @storage-keys
 * - xpensia_app_mode: "demo" | "real"
 */

import { safeStorage } from '@/utils/safe-storage';

const APP_MODE_KEY = 'xpensia_app_mode';

export type AppMode = 'demo' | 'real';

export const appMode = {
  get(): AppMode {
    const stored = safeStorage.getItem(APP_MODE_KEY);
    return (stored === 'real' ? 'real' : 'demo') as AppMode;
  },

  set(mode: AppMode): void {
    safeStorage.setItem(APP_MODE_KEY, mode);
  },

  isDemo(): boolean {
    return appMode.get() === 'demo';
  },

  isReal(): boolean {
    return appMode.get() === 'real';
  },

  /**
   * Switch to real mode. Call this on first real transaction write or
   * when user explicitly exits demo mode.
   */
  activateReal(): void {
    appMode.set('real');
    // Broadcast so any listening context can re-read real transactions
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: APP_MODE_KEY,
          newValue: 'real',
        })
      );
    }
  },

  /**
   * Initialise mode flag if it has never been set.
   * Called after demo seeding on app launch.
   */
  initializeIfAbsent(defaultMode: AppMode = 'demo'): void {
    if (!safeStorage.getItem(APP_MODE_KEY)) {
      appMode.set(defaultMode);
    }
  },
};
