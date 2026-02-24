import { Transaction } from '@/types/transaction';

type NewTransaction = Omit<Transaction, 'id'>;

const baseTransaction = (): Pick<
  NewTransaction,
  'date' | 'source' | 'currency' | 'fromAccount'
> => ({
  date: '2024-01-15',
  source: 'manual',
  currency: 'USD',
  fromAccount: 'Main Account',
});

export const makeValidExpenseTx = (
  overrides: Partial<NewTransaction> = {},
): NewTransaction => ({
  title: 'Expense',
  amount: -50,
  type: 'expense',
  category: 'Other',
  subcategory: 'Misc',
  ...baseTransaction(),
  ...overrides,
});

export const makeValidIncomeTx = (
  overrides: Partial<NewTransaction> = {},
): NewTransaction => ({
  title: 'Income',
  amount: 100,
  type: 'income',
  category: 'Other',
  subcategory: 'Misc',
  ...baseTransaction(),
  ...overrides,
});

export const makeValidTransferTx = (
  overrides: Partial<NewTransaction> = {},
): NewTransaction => ({
  title: 'Transfer',
  amount: 100,
  type: 'transfer',
  category: 'Transfer',
  subcategory: 'Transfer',
  fromAccount: 'Checking',
  toAccount: 'Savings',
  ...baseTransaction(),
  ...overrides,
});
