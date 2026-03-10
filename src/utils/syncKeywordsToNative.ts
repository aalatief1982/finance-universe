/**
 * @file syncKeywordsToNative.ts
 * @description Bridges localStorage financial keywords to native SharedPreferences
 *              so the Android FinancialSmsClassifier can read user-customized keywords.
 *
 * @module utils/syncKeywordsToNative
 *
 * @responsibilities
 * 1. Read xpensia_type_keywords from localStorage
 * 2. Flatten the object into a unique keyword string array
 * 3. Write to Capacitor Preferences (SharedPreferences on Android)
 *
 * @storage-keys
 * - xpensia_type_keywords (read from localStorage)
 * - xpensia_native_financial_keywords (written to Capacitor Preferences / SharedPreferences)
 */

import { safeStorage } from '@/utils/safe-storage';
import { safePreferences } from '@/utils/safe-storage';

const NATIVE_KEY = 'xpensia_native_financial_keywords';

/**
 * Reads the user-customised financial keywords from localStorage,
 * flattens them into a deduplicated string array, and writes them
 * to Capacitor Preferences so that native Java code can access them
 * via SharedPreferences (CapacitorStorage group).
 */
export async function syncKeywordsToNative(): Promise<void> {
  try {
    const raw = safeStorage.getItem('xpensia_type_keywords');
    if (!raw) {
      // Nothing stored — clear native side so it falls back to hardcoded list
      await safePreferences.remove({ key: NATIVE_KEY });
      return;
    }

    const parsed = JSON.parse(raw);
    let flat: string[] = [];

    if (Array.isArray(parsed)) {
      // Simple string array
      flat = parsed.filter((v: unknown) => typeof v === 'string');
    } else if (parsed && typeof parsed === 'object') {
      // Object keyed by transaction type, e.g. { expense: [...], income: [...] }
      for (const key of Object.keys(parsed)) {
        const list = parsed[key];
        if (Array.isArray(list)) {
          for (const item of list) {
            if (typeof item === 'string') {
              flat.push(item);
            }
          }
        }
      }
    }

    // Deduplicate and lowercase
    const unique = [...new Set(flat.map(k => k.trim().toLowerCase()).filter(Boolean))];

    await safePreferences.set({
      key: NATIVE_KEY,
      value: JSON.stringify(unique),
    });

    if (import.meta.env.MODE === 'development') {
      console.log('[syncKeywordsToNative] Synced', unique.length, 'keywords to native');
    }
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.warn('[syncKeywordsToNative] Failed to sync keywords:', e);
    }
  }
}
