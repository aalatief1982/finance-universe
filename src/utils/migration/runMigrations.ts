/**
 * @file runMigrations.ts
 * @description Startup migration runner that auto-applies data migrations on app load.
 *
 * @module utils/migration/runMigrations
 *
 * @responsibilities
 * 1. Track which migrations have been applied
 * 2. Run pending migrations in order
 * 3. Ensure FX fields are backfilled for legacy transactions
 *
 * @storage-keys
 * - xpensia_migrations_applied: Array of completed migration IDs
 *
 * @review-tags
 * - @side-effects: modifies stored transactions
 * - @migration: one-time data transformation
 */

import { safeStorage } from '@/utils/safe-storage';
import { getUserSettings } from '@/utils/storage-utils';
import { Transaction, FxSource } from '@/types/transaction';

const MIGRATIONS_KEY = 'xpensia_migrations_applied';

/**
 * Get list of completed migrations.
 */
const getCompletedMigrations = (): string[] => {
  try {
    const stored = safeStorage.getItem(MIGRATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Mark a migration as completed.
 */
const markMigrationComplete = (migrationId: string): void => {
  const completed = getCompletedMigrations();
  if (!completed.includes(migrationId)) {
    completed.push(migrationId);
    safeStorage.setItem(MIGRATIONS_KEY, JSON.stringify(completed));
  }
};

/**
 * Get user's base currency for migration.
 */
const getBaseCurrency = (): string => {
  try {
    const settings = getUserSettings();
    return settings?.currency?.toUpperCase() || 'SAR';
  } catch {
    return 'SAR';
  }
};

/**
 * Migration: Backfill FX fields for legacy transactions.
 * 
 * For transactions without fxSource:
 * - If currency matches base → set fxSource: 'identity', amountInBase: amount
 * - If currency differs → set fxSource: 'missing', amountInBase: null
 */
const migrateFxBackfill = (): { migrated: number; total: number } => {
  try {
    const stored = safeStorage.getItem('transactions');
    if (!stored) {
      return { migrated: 0, total: 0 };
    }

    const transactions: Transaction[] = JSON.parse(stored);
    if (!Array.isArray(transactions)) {
      return { migrated: 0, total: 0 };
    }

    const baseCurrency = getBaseCurrency();
    let migratedCount = 0;

    for (const tx of transactions) {
      // Skip if already has FX fields
      if (tx.fxSource !== undefined) {
        continue;
      }

      // Determine transaction currency (default to base if missing)
      const txCurrency = (tx.currency || baseCurrency).toUpperCase();
      const now = tx.createdAt || new Date().toISOString();

      if (txCurrency === baseCurrency) {
        // Same currency = identity conversion
        tx.currency = txCurrency;
        tx.baseCurrency = baseCurrency;
        tx.amountInBase = tx.amount;
        tx.fxRateToBase = 1;
        tx.fxSource = 'identity' as FxSource;
        tx.fxLockedAt = now;
        tx.fxPair = null;
      } else {
        // Different currency = mark as missing (no historical rate)
        tx.currency = txCurrency;
        tx.baseCurrency = baseCurrency;
        tx.amountInBase = null;
        tx.fxRateToBase = null;
        tx.fxSource = 'missing' as FxSource;
        tx.fxLockedAt = null;
        tx.fxPair = `${txCurrency}->${baseCurrency}`;
      }

      migratedCount++;
    }

    // Save if any changes
    if (migratedCount > 0) {
      safeStorage.setItem('transactions', JSON.stringify(transactions));
      if (import.meta.env.MODE === 'development') {
        console.log(`[Migration] fx_backfill_v2: Migrated ${migratedCount}/${transactions.length} transactions`);
      }
    }

    return { migrated: migratedCount, total: transactions.length };
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[Migration] fx_backfill_v2 failed:', error);
    }
    return { migrated: 0, total: 0 };
  }
};

/**
 * Run all pending migrations on app startup.
 * Safe to call multiple times - completed migrations are skipped.
 */
export const runMigrations = (): void => {
  const completed = getCompletedMigrations();

  // Migration 1: FX fields backfill
  if (!completed.includes('fx_backfill_v2')) {
    const result = migrateFxBackfill();
    markMigrationComplete('fx_backfill_v2');
    if (import.meta.env.MODE === 'development') {
      console.log('[Migration] fx_backfill_v2 completed:', result);
    }
  }

  // Add future migrations here...
};

/**
 * Reset all migration flags (for testing purposes).
 */
export const resetMigrations = (): void => {
  safeStorage.removeItem(MIGRATIONS_KEY);
};

/**
 * Check if a specific migration has been completed.
 */
export const isMigrationComplete = (migrationId: string): boolean => {
  return getCompletedMigrations().includes(migrationId);
};
