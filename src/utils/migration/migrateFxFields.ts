/**
 * @file migrateFxFields.ts
 * @description One-time migration to add FX fields to existing transactions.
 *
 * @module utils/migration/migrateFxFields
 *
 * @responsibilities
 * 1. Detect transactions without FX fields
 * 2. Apply default FX values based on currency comparison
 * 3. Mark migration as complete to prevent re-runs
 *
 * @storage-keys
 * - xpensia_transactions: Transaction storage
 * - xpensia_migration_fx_v1: Migration flag
 *
 * @review-tags
 * - @side-effects: modifies stored transactions
 * - @migration: one-time data transformation
 */

import { safeStorage } from '@/utils/safe-storage';
import { getUserSettings } from '@/utils/storage-utils';
import { Transaction } from '@/types/transaction';
import { FxSource, TransactionFxFields } from '@/types/fx';

const MIGRATION_KEY = 'xpensia_migration_fx_v1';

/**
 * Get the user's base currency for migration.
 * Falls back to 'SAR' if not configured.
 */
const getBaseCurrencyForMigration = (): string => {
  try {
    const settings = getUserSettings();
    return settings?.currency || 'SAR';
  } catch {
    return 'SAR';
  }
};

/**
 * Determine FX fields for a legacy transaction without FX data.
 */
const determineFxFieldsForLegacyTx = (
  tx: Transaction,
  baseCurrency: string
): TransactionFxFields => {
  // Determine the transaction's currency
  // Use existing currency field, or default to base currency
  const txCurrency = tx.currency?.toUpperCase() || baseCurrency;
  const now = tx.createdAt || new Date().toISOString();

  // If same currency as base, it's an identity conversion
  if (txCurrency === baseCurrency.toUpperCase()) {
    return {
      currency: txCurrency,
      baseCurrency: baseCurrency.toUpperCase(),
      amountInBase: tx.amount,
      fxRateToBase: 1,
      fxSource: 'identity' as FxSource,
      fxLockedAt: now,
      fxPair: null,
    };
  }

  // Different currency - we don't have historical rates
  // Mark as missing conversion
  return {
    currency: txCurrency,
    baseCurrency: baseCurrency.toUpperCase(),
    amountInBase: null,
    fxRateToBase: null,
    fxSource: 'missing' as FxSource,
    fxLockedAt: null,
    fxPair: `${txCurrency}->${baseCurrency.toUpperCase()}`,
  };
};

/**
 * Check if a transaction already has FX fields.
 */
const hasFxFields = (tx: Record<string, unknown>): boolean => {
  return (
    tx.baseCurrency !== undefined &&
    tx.fxSource !== undefined
  );
};

/**
 * Run the FX fields migration.
 * Adds FX fields to all transactions that don't have them.
 */
export const migrateFxFields = (): { migrated: number; total: number } => {
  // Check if migration has already been run
  const migrationDone = safeStorage.getItem(MIGRATION_KEY);
  if (migrationDone === 'true') {
    return { migrated: 0, total: 0 };
  }

  try {
    const stored = safeStorage.getItem('xpensia_transactions');
    if (!stored) {
      // No transactions to migrate, mark as done
      safeStorage.setItem(MIGRATION_KEY, 'true');
      return { migrated: 0, total: 0 };
    }

    const transactions = JSON.parse(stored);
    if (!Array.isArray(transactions)) {
      safeStorage.setItem(MIGRATION_KEY, 'true');
      return { migrated: 0, total: 0 };
    }

    const baseCurrency = getBaseCurrencyForMigration();
    let migratedCount = 0;

    // Group transfers by transferId to process them together
    const transferGroups = new Map<string, Record<string, unknown>[]>();

    for (const tx of transactions) {
      if (tx.transferId) {
        const group = transferGroups.get(tx.transferId) || [];
        group.push(tx);
        transferGroups.set(tx.transferId, group);
      }
    }

    // Process each transaction
    for (const tx of transactions) {
      if (hasFxFields(tx)) {
        continue; // Already has FX fields
      }

      // Get FX fields for this transaction
      const fxFields = determineFxFieldsForLegacyTx(tx, baseCurrency);

      // Apply FX fields
      tx.currency = fxFields.currency;
      tx.baseCurrency = fxFields.baseCurrency;
      tx.amountInBase = fxFields.amountInBase;
      tx.fxRateToBase = fxFields.fxRateToBase;
      tx.fxSource = fxFields.fxSource;
      tx.fxLockedAt = fxFields.fxLockedAt;
      tx.fxPair = fxFields.fxPair;

      migratedCount++;
    }

    // Ensure both halves of transfers have consistent FX data
    for (const [transferId, group] of transferGroups) {
      if (group.length !== 2) continue;

      // Use the FX data from the first entry for both
      // (transfers should have the same currency context)
      const reference = group[0];
      for (const tx of group) {
        if (tx !== reference) {
          tx.currency = reference.currency;
          tx.baseCurrency = reference.baseCurrency;
          // Keep amount signs but use same rate
          tx.fxRateToBase = reference.fxRateToBase;
          tx.fxSource = reference.fxSource;
          tx.fxLockedAt = reference.fxLockedAt;
          tx.fxPair = reference.fxPair;
          // Recalculate amountInBase with correct sign
          if (reference.fxRateToBase !== null) {
            tx.amountInBase = tx.amount * reference.fxRateToBase;
          } else {
            tx.amountInBase = null;
          }
        }
      }
    }

    // Save migrated transactions
    if (migratedCount > 0) {
      safeStorage.setItem('xpensia_transactions', JSON.stringify(transactions));
      if (import.meta.env.MODE === 'development') {
        console.log(`[Migration] Added FX fields to ${migratedCount} transactions`);
      }
    }

    // Mark migration as complete
    safeStorage.setItem(MIGRATION_KEY, 'true');

    if (import.meta.env.MODE === 'development') {
      console.log('[Migration] FX fields migration completed');
    }

    return { migrated: migratedCount, total: transactions.length };
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[Migration] FX fields migration failed:', error);
    }
    // Don't mark as done on error - will retry next startup
    return { migrated: 0, total: 0 };
  }
};

/**
 * Reset the migration flag (for testing purposes).
 */
export const resetFxMigration = (): void => {
  safeStorage.removeItem(MIGRATION_KEY);
};

/**
 * Check if the FX migration has been completed.
 */
export const isFxMigrationComplete = (): boolean => {
  return safeStorage.getItem(MIGRATION_KEY) === 'true';
};
