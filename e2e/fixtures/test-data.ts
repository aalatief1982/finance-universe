/**
 * Shared test data for E2E tests
 */

export const testTransaction = {
  title: 'E2E Test Coffee',
  amount: '5.50',
  category: 'Food',
  type: 'expense' as const,
};

export const testTransfer = {
  title: 'E2E Transfer Test',
  amount: '100.00',
  fromAccount: 'Checking',
  toAccount: 'Savings',
};

export const testBudget = {
  category: 'Food',
  amount: '500.00',
  period: 'monthly' as const,
};

export const testAccount = {
  name: 'E2E Test Account',
  type: 'checking' as const,
  balance: '1000.00',
};

export const testSmsMessage = `Your VISA card ending 4321 was charged SAR 150.00 at STARBUCKS on 15/01/2024. Available Balance: SAR 2500.00`;

export const testSmartPasteInput = `
Coffee at Starbucks - $4.50
Uber ride - $12.00
Grocery shopping at Whole Foods - $85.50
`;

export const routes = {
  home: '/',
  transactions: '/transactions',
  analytics: '/analytics',
  budget: '/budget',
  budgetSet: '/budget/set',
  budgetReport: '/budget/report',
  budgetAccounts: '/budget/accounts',
  importTransactions: '/import-transactions',
  settings: '/settings',
  profile: '/profile',
  onboarding: '/onboarding',
};
