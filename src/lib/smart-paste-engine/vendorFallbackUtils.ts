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
const ZERO_WIDTH_CHARS = /[\u200B-\u200D\uFEFF]/g;

export function normalizeVendorNameForCompare(value: string): string {
  return value
    .replace(ZERO_WIDTH_CHARS, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function sanitizeVendorName(value: string): string {
  return value
    .replace(ZERO_WIDTH_CHARS, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function isVendorNameValid(value: string): boolean {
  const cleaned = sanitizeVendorName(value);
  if (cleaned.length < 2) return false;
  if (!/[A-Za-z\u0600-\u06FF]/.test(cleaned)) return false;
  if (/^[\d\s.,\-_/+()]+$/.test(cleaned)) return false;
  return true;
}

export function findVendorByNormalizedName(
  vendors: string[],
  candidate: string,
): string | undefined {
  const normalizedCandidate = normalizeVendorNameForCompare(candidate);
  return vendors.find(
    (vendor) => normalizeVendorNameForCompare(vendor) === normalizedCandidate,
  );
}

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
  const sanitizedName = sanitizeVendorName(name);
  if (!isVendorNameValid(sanitizedName)) return;
  const vendors = loadVendorFallbacks();
  const existingName = findVendorByNormalizedName(
    Object.keys(vendors),
    sanitizedName,
  );
  if (!existingName) {
    vendors[sanitizedName] = {
      ...data,
      ...(user ? { user: true } : {}),
    } as VendorFallbackData;
    saveVendorFallbacks(vendors);
  }
}

export { KEY as VENDOR_FALLBACK_KEY };
