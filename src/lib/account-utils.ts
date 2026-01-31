/**
 * @file account-utils.ts
 * @description Account list storage helpers and defaults.
 *
 * @module lib/account-utils
 *
 * @responsibilities
 * 1. Load stored accounts with defaults
 * 2. Add user-defined accounts with duplicate prevention
 *
 * @storage-keys
 * - xpensia_accounts: user account list
 *
 * @dependencies
 * - safe-storage.ts: localStorage wrapper
 *
 * @review-tags
 * - @risk: duplicate account name handling
 *
 * @review-checklist
 * - [ ] Empty account names are rejected
 * - [ ] Duplicate check is case-insensitive
 * - [ ] Defaults are preserved when storage is empty
 */

import { safeStorage } from "@/utils/safe-storage";
export interface Account {
  name: string;
  iban?: string;
  user?: boolean;
}

const ACCOUNTS_KEY = 'xpensia_accounts';

export const DEFAULT_ACCOUNTS: Account[] = [
  { name: 'Cash' },
  { name: 'Bank Account' },
  { name: 'Credit Card' },
  { name: 'Savings' },
  { name: 'Investment' },
  { name: 'Other' }
];

export function getStoredAccounts(): Account[] {
  try {
    const raw = safeStorage.getItem(ACCOUNTS_KEY);
    const userAccounts: Account[] = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_ACCOUNTS, ...userAccounts];
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
}

export function addUserAccount(account: Account, user = true) {
  if (!account.name.trim()) return;
  try {
    const raw = safeStorage.getItem(ACCOUNTS_KEY);
    const arr: Account[] = raw ? JSON.parse(raw) : [];
    if (!arr.some(a => a.name.toLowerCase() === account.name.toLowerCase())) {
      arr.push({ ...account, ...(user ? { user: true } : {}) });
      safeStorage.setItem(ACCOUNTS_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}
