/**
 * @file vendorFallbackUtils.ts
 * @description Vendor-to-category fallback mappings for Smart Paste.
 *              Provides category suggestions based on known vendor names.
 *
 * @responsibilities
 * - Load/save vendor fallback mappings from localStorage
 * - Provide vendor name list for autocomplete
 * - Allow user-added vendor mappings
 *
 * @storage-keys
 * - xpensia_vendor_fallbacks: Vendor-to-category/type mappings
 *
 * @dependencies
 * - safe-storage.ts: localStorage wrapper
 *
 * @review-checklist
 * - [ ] User-added vendors marked with user: true flag
 * - [ ] Empty vendor names rejected in addUserVendor
 * - [ ] Load gracefully handles corrupted JSON
 */

import { safeStorage } from "@/utils/safe-storage";

// ============================================================================
// SECTION: Type Definitions
// ============================================================================

export interface VendorFallbackData {
  type: 'expense' | 'income' | 'transfer';
  category: string;
  subcategory: string;
  /** Indicates entry was added by the user */
  user?: boolean;
}

const KEY = 'xpensia_vendor_fallbacks';

// ============================================================================
// SECTION: Vendor Fallback CRUD
// PURPOSE: Load/save vendor-to-category mappings
// REVIEW: Error handling for corrupted storage
// ============================================================================

/**
 * Load vendor fallback mappings from storage.
 * Returns empty object on parse failure.
 */
export function loadVendorFallbacks(): Record<string, VendorFallbackData> {
  const raw = safeStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, VendorFallbackData>;
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorFallbackUtils] Failed to parse stored vendor data:', e);
    }
    return {};
  }
}

export function saveVendorFallbacks(data: Record<string, VendorFallbackData>): void {
  safeStorage.setItem(KEY, JSON.stringify(data));
}

/**
 * Get list of all known vendor names.
 * Useful for autocomplete in transaction forms.
 */
export function getVendorNames(): string[] {
  return Object.keys(loadVendorFallbacks());
}

/**
 * Add a user-defined vendor mapping.
 * Only adds if vendor name is non-empty and not already present.
 * 
 * @param name - Vendor name
 * @param data - Category/subcategory/type mapping
 * @param user - Mark as user-added (default true)
 */
export function addUserVendor(
  name: string,
  data: Omit<VendorFallbackData, 'user'>,
  user: boolean = true
): void {
  if (!name.trim()) return;
  const vendors = loadVendorFallbacks();
  if (!vendors[name]) {
    vendors[name] = { ...data, ...(user ? { user: true } : {}) } as VendorFallbackData;
    saveVendorFallbacks(vendors);
  }
}

export { KEY as VENDOR_FALLBACK_KEY };
