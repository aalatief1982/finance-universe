/**
 * @file AccountService.ts
 * @description Centralized service for account management including CRUD operations,
 *              balance calculations, and transaction linkage tracking.
 * 
 * @module services/AccountService
 * 
 * @responsibilities
 * 1. Account CRUD operations with validation
 * 2. Account balance calculations (initial + transaction effects)
 * 3. Transaction linkage tracking (prevent deletion of linked accounts)
 * 4. Unmanaged account detection (accounts in transactions but not defined)
 * 
 * @storage-keys
 * - xpensia_accounts: Account definitions
 * 
 * @dependencies
 * - TransactionService.ts: For transaction queries
 * 
 * @review-checklist
 * - [ ] Balance calculation handles dual-entry transfers correctly
 * - [ ] Deletion protection for linked accounts
 * - [ ] Account lookup by ID and name consistency
 * 
 * @created 2024
 * @modified 2025-01-30
 */

import { safeStorage } from "@/utils/safe-storage";
import { v4 as uuidv4 } from 'uuid';
import { Account } from '@/models/account';
import { transactionService } from './TransactionService';

const STORAGE_KEY = 'xpensia_accounts';

export class AccountService {

  // ============================================================================
  // SECTION: Account CRUD Operations
  // PURPOSE: Basic read/write operations for account management
  // REVIEW: Verify default values for missing fields during retrieval
  // ============================================================================

  /**
   * Get all accounts from storage with defaults applied.
   * Handles missing fields from legacy data.
   * 
   * @returns Array of accounts with all required fields
   */
  getAccounts(): Account[] {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY);
      const arr: Partial<Account>[] = raw ? JSON.parse(raw) : [];
      return arr.map(a => ({
        id: a.id || uuidv4(),
        name: a.name || '',
        type: (a.type as Account['type']) || 'Cash',
        currency: a.currency || 'USD',
        initialBalance: a.initialBalance || 0,
        startDate: a.startDate || new Date().toISOString().split('T')[0],
        tags: a.tags || []
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get a single account by ID.
   * 
   * @param id - Account ID
   * @returns Account or null if not found
   */
  getAccountById(id: string): Account | null {
    return this.getAccounts().find(a => a.id === id) || null;
  }

  /**
   * Get a single account by name (case-insensitive).
   * 
   * @param name - Account name
   * @returns Account or null if not found
   */
  getAccountByName(name: string): Account | null {
    return this.getAccounts().find(a => a.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Add a new account to storage.
   * 
   * @param account - Account to add
   * @returns The added account
   */
  addAccount(account: Account): Account {
    const accounts = this.getAccounts();
    accounts.push(account);
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return account;
  }

  /**
   * Update an existing account.
   * 
   * @param id - Account ID to update
   * @param updates - Partial account fields
   * @returns Updated account or null if not found
   */
  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    
    if (index === -1) return null;
    
    const updated = { ...accounts[index], ...updates };
    accounts[index] = updated;
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return updated;
  }

  // ============================================================================
  // SECTION: Account Deletion with Protection
  // PURPOSE: Prevent deletion of accounts that have linked transactions
  // REVIEW: Verify linkage check covers all transaction account fields
  // ============================================================================

  /**
   * Delete an account with linkage protection.
   * Prevents deletion if account has linked transactions.
   * 
   * @param id - Account ID to delete
   * @returns Success status and optional error message
   * 
   * @review-focus Linkage check prevents orphaned transactions
   */
  deleteAccount(id: string): { success: boolean; error?: string } {
    // Check if account is linked to any transactions
    const linkedCount = this.getLinkedTransactionCount(id);
    
    if (linkedCount > 0) {
      return {
        success: false,
        error: `Cannot delete: This account is linked to ${linkedCount} transaction${linkedCount > 1 ? 's' : ''}.`
      };
    }

    const accounts = this.getAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    
    if (filtered.length === accounts.length) {
      return { success: false, error: 'Account not found.' };
    }

    safeStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return { success: true };
  }

  // ============================================================================
  // SECTION: Transaction Linkage Tracking
  // PURPOSE: Track which transactions reference an account
  // REVIEW: Verify all transaction account fields are checked
  // ============================================================================

  /**
   * Get count of transactions linked to an account.
   * Checks by both ID and name for compatibility.
   * 
   * @param accountIdOrName - Account ID or name to check
   * @returns Number of linked transactions
   * 
   * @review-focus Checks: fromAccount, toAccount, account fields
   */
  getLinkedTransactionCount(accountIdOrName: string): number {
    const account = this.getAccountById(accountIdOrName) || this.getAccountByName(accountIdOrName);
    const accountName = account?.name || accountIdOrName;
    const accountId = account?.id || accountIdOrName;

    const transactions = transactionService.getAllTransactions();
    
    return transactions.filter(tx => 
      tx.fromAccount === accountName ||
      tx.fromAccount === accountId ||
      tx.toAccount === accountName ||
      tx.toAccount === accountId ||
      tx.account === accountName ||
      tx.account === accountId
    ).length;
  }

  /**
   * Check if an account can be safely deleted.
   * 
   * @param id - Account ID to check
   * @returns true if no linked transactions exist
   */
  canDeleteAccount(id: string): boolean {
    return this.getLinkedTransactionCount(id) === 0;
  }

  /**
   * Get all unique account names used in transactions.
   * Useful for migration or sync operations.
   * 
   * @returns Array of unique account names from transactions
   */
  getAccountNamesFromTransactions(): string[] {
    const transactions = transactionService.getAllTransactions();
    const names = new Set<string>();

    transactions.forEach(tx => {
      if (tx.fromAccount) names.add(tx.fromAccount);
      if (tx.toAccount) names.add(tx.toAccount);
      if (tx.account) names.add(tx.account);
    });

    return Array.from(names).filter(Boolean);
  }

  /**
   * Get unmanaged accounts - those used in transactions but not defined.
   * Helps identify accounts that need to be formally created.
   * 
   * @returns Array of account names/IDs not in accounts list
   */
  getUnmanagedAccounts(): string[] {
    const existingAccounts = this.getAccounts();
    const existingNames = existingAccounts.map(a => a.name.toLowerCase());
    const existingIds = existingAccounts.map(a => a.id);

    const txAccountNames = this.getAccountNamesFromTransactions();

    return txAccountNames.filter(name => 
      !existingNames.includes(name.toLowerCase()) &&
      !existingIds.includes(name)
    );
  }

  // ============================================================================
  // SECTION: Balance Calculation
  // PURPOSE: Calculate current balance for an account from transactions
  // REVIEW: Critical - must handle dual-entry transfers correctly
  // ============================================================================

  /**
   * Calculate current balance for an account.
   * Starts from initialBalance and applies all transaction effects.
   * 
   * @param accountId - Account ID to calculate balance for
   * @returns Current balance
   * 
   * @review-focus
   * - Dual-entry transfers: debit entry decreases, credit entry increases
   * - Legacy single-entry transfers: both accounts affected by same record
   * - Income increases balance, expense decreases
   * 
   * @review-risk
   * - Lines 196-207: Dual-entry handling - 'out' decreases, 'in' increases
   * - Lines 209-213: Legacy fallback for transfers without transferDirection
   */
  getAccountBalance(accountId: string): number {
    const account = this.getAccountById(accountId);
    if (!account) return 0;

    const transactions = transactionService.getAllTransactions();
    let balance = account.initialBalance;

    transactions.forEach(tx => {
      const isFromAccount = tx.fromAccount === account.name || tx.fromAccount === account.id;
      const isToAccount = tx.toAccount === account.name || tx.toAccount === account.id;
      const isAccount = tx.account === account.name || tx.account === account.id;

      if (tx.type === 'transfer') {
        // With dual-entry model, each transfer record only affects ONE account
        // Debit entry (out): affects fromAccount - money leaves
        // Credit entry (in): affects toAccount - money arrives
        if (tx.transferDirection === 'out' && isFromAccount) {
          balance -= Math.abs(tx.amount);
        } else if (tx.transferDirection === 'in' && isToAccount) {
          balance += Math.abs(tx.amount);
        }
        // Legacy single-entry transfers (no transferDirection)
        // @review-risk Old data may not have transferDirection set
        else if (!tx.transferDirection) {
          if (isFromAccount) balance -= Math.abs(tx.amount);
          if (isToAccount) balance += Math.abs(tx.amount);
        }
      } else if (tx.type === 'expense') {
        // Expense decreases account balance
        if (isFromAccount || isAccount) balance -= Math.abs(tx.amount);
      } else if (tx.type === 'income') {
        // Income increases account balance
        if (isToAccount || isAccount) balance += Math.abs(tx.amount);
      }
    });

    return balance;
  }
}

export const accountService = new AccountService();
