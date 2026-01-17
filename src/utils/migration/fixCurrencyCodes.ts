/**
 * One-time migration to fix corrupted currency codes in stored transactions
 * Runs on app startup to normalize any Arabic currency names to ISO codes
 */

import { safeStorage } from '@/utils/safe-storage';
import { normalizeCurrencyCode, isValidCurrencyCode } from '@/utils/currency-utils';

const MIGRATION_KEY = 'xpensia_migration_currency_codes_v1';

/**
 * Fixes corrupted currency codes in stored transactions
 * This is a one-time migration that runs on app startup
 */
export const fixCorruptedCurrencyCodes = (): void => {
  // Check if migration has already been run
  const migrationDone = safeStorage.getItem(MIGRATION_KEY);
  if (migrationDone === 'true') {
    return;
  }

  try {
    const stored = safeStorage.getItem('transactions');
    if (!stored) {
      // No transactions to migrate, mark as done
      safeStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    const transactions = JSON.parse(stored);
    if (!Array.isArray(transactions)) {
      safeStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    let modifiedCount = 0;

    for (const tx of transactions) {
      if (tx.currency && !isValidCurrencyCode(tx.currency)) {
        const normalized = normalizeCurrencyCode(tx.currency);
        if (normalized !== tx.currency) {
          // Store original for reference in details
          if (!tx.details) {
            tx.details = {};
          }
          tx.details.originalCurrency = tx.currency;
          tx.currency = normalized;
          modifiedCount++;
        }
      }
    }

    if (modifiedCount > 0) {
      safeStorage.setItem('transactions', JSON.stringify(transactions));
      if (import.meta.env.MODE === 'development') {
        console.log(`[Migration] Fixed ${modifiedCount} transactions with invalid currency codes`);
      }
    }

    // Mark migration as complete
    safeStorage.setItem(MIGRATION_KEY, 'true');
    
    if (import.meta.env.MODE === 'development') {
      console.log('[Migration] Currency code migration completed');
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[Migration] Failed to fix currency codes:', error);
    }
    // Don't mark as done on error - will retry next startup
  }
};

/**
 * Resets the migration flag (for testing purposes)
 */
export const resetCurrencyMigration = (): void => {
  safeStorage.removeItem(MIGRATION_KEY);
};
