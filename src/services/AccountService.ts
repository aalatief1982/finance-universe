import { safeStorage } from "@/utils/safe-storage";
import { v4 as uuidv4 } from 'uuid';
import { Account } from '@/models/account';
import { transactionService } from './TransactionService';

const STORAGE_KEY = 'xpensia_accounts';

export class AccountService {
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

  getAccountById(id: string): Account | null {
    return this.getAccounts().find(a => a.id === id) || null;
  }

  getAccountByName(name: string): Account | null {
    return this.getAccounts().find(a => a.name.toLowerCase() === name.toLowerCase()) || null;
  }

  addAccount(account: Account): Account {
    const accounts = this.getAccounts();
    accounts.push(account);
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return account;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    
    if (index === -1) return null;
    
    const updated = { ...accounts[index], ...updates };
    accounts[index] = updated;
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return updated;
  }

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

  /**
   * Get count of transactions linked to an account (by id or name)
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
   * Check if an account can be safely deleted
   */
  canDeleteAccount(id: string): boolean {
    return this.getLinkedTransactionCount(id) === 0;
  }

  /**
   * Get all unique account names used in transactions (for migration/sync)
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
   * Get unmanaged accounts (used in transactions but not in accounts list)
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

  /**
   * Calculate current balance for an account
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
        // Debit entry (out): affects fromAccount
        // Credit entry (in): affects toAccount
        if (tx.transferDirection === 'out' && isFromAccount) {
          balance -= Math.abs(tx.amount);
        } else if (tx.transferDirection === 'in' && isToAccount) {
          balance += Math.abs(tx.amount);
        }
        // Legacy single-entry transfers (no transferDirection)
        else if (!tx.transferDirection) {
          if (isFromAccount) balance -= Math.abs(tx.amount);
          if (isToAccount) balance += Math.abs(tx.amount);
        }
      } else if (tx.type === 'expense') {
        if (isFromAccount || isAccount) balance -= Math.abs(tx.amount);
      } else if (tx.type === 'income') {
        if (isToAccount || isAccount) balance += Math.abs(tx.amount);
      }
    });

    return balance;
  }
}

export const accountService = new AccountService();
