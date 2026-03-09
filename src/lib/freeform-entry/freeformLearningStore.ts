/**
 * @file freeformLearningStore.ts
 * @description Isolated localStorage-backed learning store for freeform/manual/voice input.
 *              NEVER reads or writes SMS template banks, keyword banks, or sender-based logic.
 *
 * @module lib/freeform-entry/freeformLearningStore
 *
 * @storage-keys
 * - xpensia_freeform_learned_mappings: FreeformLearnedMapping[]
 */

import { safeStorage } from '@/utils/safe-storage';
import type { Transaction } from '@/types/transaction';
import type { FreeformLearnedMapping } from './freeformTypes';

const STORAGE_KEY = 'xpensia_freeform_learned_mappings';

// ============================================================================
// SECTION: Load / Save
// ============================================================================

export function loadFreeformMappings(): FreeformLearnedMapping[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFreeformMappings(mappings: FreeformLearnedMapping[]): void {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
}

// ============================================================================
// SECTION: Normalize
// ============================================================================

function normalizeKey(vendor: string): string {
  return vendor.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ============================================================================
// SECTION: Lookup
// ============================================================================

/**
 * Look up a previously learned mapping for a vendor/phrase.
 * Returns the mapping if found, undefined otherwise.
 */
export function lookupFreeformHint(
  vendor: string,
): FreeformLearnedMapping | undefined {
  if (!vendor?.trim()) return undefined;
  const key = normalizeKey(vendor);
  const mappings = loadFreeformMappings();
  return mappings.find((m) => m.normalizedVendor === key);
}

// ============================================================================
// SECTION: Learn from confirmed save
// ============================================================================

/**
 * Record a freeform learning signal from a user-confirmed transaction save.
 * Only called for freeform/voice sources. Never touches SMS stores.
 *
 * @param phrase - The vendor/title string from the freeform parse
 * @param confirmedTransaction - The user-confirmed transaction
 */
export function learnFromFreeformConfirmation(
  phrase: string,
  confirmedTransaction: Transaction,
): void {
  const key = normalizeKey(phrase);
  if (!key || key.length < 2) return;

  const mappings = loadFreeformMappings();
  const existing = mappings.find((m) => m.normalizedVendor === key);

  if (existing) {
    // Update existing mapping
    existing.category = confirmedTransaction.category;
    existing.subcategory = confirmedTransaction.subcategory || 'none';
    existing.type = confirmedTransaction.type;
    if (confirmedTransaction.currency) {
      existing.currency = confirmedTransaction.currency;
    }
    existing.confirmedCount += 1;
    existing.lastConfirmedAt = new Date().toISOString();
  } else {
    // Create new mapping
    mappings.push({
      normalizedVendor: key,
      category: confirmedTransaction.category,
      subcategory: confirmedTransaction.subcategory || 'none',
      type: confirmedTransaction.type,
      currency: confirmedTransaction.currency,
      confirmedCount: 1,
      lastConfirmedAt: new Date().toISOString(),
    });
  }

  saveFreeformMappings(mappings);
}
