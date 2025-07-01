import { v4 as uuidv4 } from 'uuid';
import { Account } from '@/models/account';

const STORAGE_KEY = 'xpensia_accounts';

export class AccountService {
  getAccounts(): Account[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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

  addAccount(account: Account) {
    const accounts = this.getAccounts();
    accounts.push(account);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }

  updateAccount(id: string, updates: Partial<Account>) {
    const accounts = this.getAccounts().map(a =>
      a.id === id ? { ...a, ...updates } : a
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }
}

export const accountService = new AccountService();
