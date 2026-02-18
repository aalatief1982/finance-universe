/**
 * @file demo-storage.ts
 * @description Thin wrapper around safeStorage for the demo transaction namespace.
 *
 * @storage-keys
 * - xpensia_tx_demo: JSON array of demo Transaction objects
 */

import { safeStorage } from '@/utils/safe-storage';
import { Transaction } from '@/types/transaction';

export const DEMO_STORAGE_KEY = 'xpensia_tx_demo';

export const demoStorage = {
  getTransactions(): Transaction[] {
    try {
      const raw = safeStorage.getItem(DEMO_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Transaction[]) : [];
    } catch {
      return [];
    }
  },

  setTransactions(transactions: Transaction[]): void {
    safeStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(transactions));
    // Broadcast so TransactionContext can react to demo data changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: DEMO_STORAGE_KEY,
          newValue: JSON.stringify(transactions),
        })
      );
    }
  },

  clear(): void {
    safeStorage.removeItem(DEMO_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: DEMO_STORAGE_KEY,
          newValue: null,
        })
      );
    }
  },

  hasData(): boolean {
    return demoStorage.getTransactions().length > 0;
  },
};
