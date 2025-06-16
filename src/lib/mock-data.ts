import { Transaction, TimePeriodData } from '@/types/transaction';

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Grocery Shopping',
    amount: -50.25,
    category: 'Food',
    date: '2024-01-20',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Credit Card'
  },
  {
    id: '2',
    title: 'Salary Deposit',
    amount: 3000,
    category: 'Income',
    date: '2024-01-15',
    type: 'income',
    source: 'manual',
    toAccount: 'Checking Account'
  },
  {
    id: '3',
    title: 'Movie Night',
    amount: -20,
    category: 'Entertainment',
    date: '2024-01-10',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Cash'
  },
  {
    id: '4',
    title: 'Online Purchase',
    amount: -75.50,
    category: 'Shopping',
    date: '2024-01-05',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Credit Card'
  },
  {
    id: '5',
    title: 'Rent Payment',
    amount: -1200,
    category: 'Housing',
    date: '2024-01-01',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Checking Account'
  },
  {
    id: '6',
    title: 'Dividends',
    amount: 150,
    category: 'Investment',
    date: '2024-02-03',
    type: 'income',
    source: 'manual',
    toAccount: 'Investment Account'
  },
  {
    id: '7',
    title: 'Coffee with Friend',
    amount: -5.50,
    category: 'Food',
    date: '2024-02-08',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Cash'
  },
  {
    id: '8',
    title: 'Electronics Purchase',
    amount: -300,
    category: 'Shopping',
    date: '2024-02-12',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Credit Card'
  },
  {
    id: '9',
    title: 'Utility Bill',
    amount: -80,
    category: 'Utilities',
    date: '2024-02-18',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Checking Account'
  },
  {
    id: '10',
    title: 'Bonus Payment',
    amount: 500,
    category: 'Income',
    date: '2024-02-22',
    type: 'income',
    source: 'manual',
    toAccount: 'Checking Account'
  }
];

export const mockTimePeriodData: TimePeriodData[] = [
  { date: '2024-01', income: 5000, expenses: 3200 },
  { date: '2024-02', income: 5200, expenses: 2800 },
  { date: '2024-03', income: 4800, expenses: 3500 },
  { date: '2024-04', income: 5100, expenses: 2900 },
  { date: '2024-05', income: 5300, expenses: 3100 },
  { date: '2024-06', income: 5000, expenses: 3300 }
];

export const mockExpensesByCategory = [
  { name: 'Food', value: 1200 },
  { name: 'Shopping', value: 800 },
  { name: 'Entertainment', value: 500 },
  { name: 'Utilities', value: 300 },
  { name: 'Other', value: 200 }
];

export const mockExpensesByDate = [
  { date: '2024-01-01', amount: 150 },
  { date: '2024-01-08', amount: 80 },
  { date: '2024-01-15', amount: 200 },
  { date: '2024-01-22', amount: 120 },
  { date: '2024-01-29', amount: 180 }
];

export const CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Income',
  'Investment',
  'Travel',
  'Other'
];

export const INITIAL_TRANSACTIONS = mockTransactions;
