/**
 * @file admin-utils.ts
 * @description Client-side admin mode utilities using SHA-256 hashed PIN.
 * Provides tap-to-unlock admin mode for diagnostic sections.
 */

import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'xpensia_admin_mode';

// SHA-256 hash of the admin PIN "1234"
// To change: run CryptoJS.SHA256("YOUR_NEW_PIN").toString() and replace this value
const ADMIN_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

/**
 * Check if admin mode is currently active.
 */
export function isAdminMode(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === ADMIN_PIN_HASH;
  } catch {
    return false;
  }
}

/**
 * Attempt to activate admin mode with a PIN.
 * Returns true if the PIN is correct.
 */
export function activateAdminMode(pin: string): boolean {
  const hash = CryptoJS.SHA256(pin).toString();
  if (hash === ADMIN_PIN_HASH) {
    localStorage.setItem(STORAGE_KEY, hash);
    return true;
  }
  return false;
}

/**
 * Deactivate admin mode by clearing the stored flag.
 */
export function deactivateAdminMode(): void {
  localStorage.removeItem(STORAGE_KEY);
}
