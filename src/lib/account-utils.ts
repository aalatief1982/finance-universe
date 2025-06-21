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
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const userAccounts: Account[] = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_ACCOUNTS, ...userAccounts];
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
}

export function addUserAccount(account: Account, user = true) {
  if (!account.name.trim()) return;
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const arr: Account[] = raw ? JSON.parse(raw) : [];
    if (!arr.some(a => a.name.toLowerCase() === account.name.toLowerCase())) {
      arr.push({ ...account, ...(user ? { user: true } : {}) });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}
