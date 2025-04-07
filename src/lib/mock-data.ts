
import { Transaction, TransactionType } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

// Create mock transactions for development
export const mockTransactions: Transaction[] = [
  {
    id: uuidv4(),
    title: 'Grocery Shopping',
    amount: -120.50,
    category: 'groceries',
    categoryPath: 'Food & Dining > Groceries',
    date: '2023-04-01T12:30:00Z',
    type: 'expense',
    notes: 'Weekly grocery run',
    source: 'manual',
    fromAccount: 'Main Account',
    currency: 'USD'
  },
  {
    id: uuidv4(),
    title: 'Salary Deposit',
    amount: 3500,
    category: 'income',
    categoryPath: 'Income > Salary',
    date: '2023-04-01T09:00:00Z',
    type: 'income',
    notes: 'Monthly salary',
    source: 'manual',
    toAccount: 'Main Account',
    currency: 'USD'
  },
  {
    id: uuidv4(),
    title: 'Restaurant Dinner',
    amount: -85.20,
    category: 'dining',
    categoryPath: 'Food & Dining > Restaurants',
    date: '2023-04-02T19:45:00Z',
    type: 'expense',
    notes: 'Dinner with friends',
    source: 'manual',
    fromAccount: 'Credit Card',
    currency: 'USD'
  },
  {
    id: uuidv4(),
    title: 'Gas Station',
    amount: -45.75,
    category: 'transportation',
    categoryPath: 'Transportation > Gas',
    date: '2023-04-03T14:15:00Z',
    type: 'expense',
    source: 'manual',
    fromAccount: 'Credit Card',
    currency: 'USD'
  },
  {
    id: uuidv4(),
    title: 'Electricity Bill',
    amount: -120,
    category: 'utilities',
    categoryPath: 'Housing > Utilities',
    date: '2023-04-05T10:00:00Z',
    type: 'expense',
    notes: 'Monthly electricity bill',
    source: 'manual',
    fromAccount: 'Main Account',
    currency: 'USD'
  }
];

// Export for other files that might need it
export const INITIAL_TRANSACTIONS = mockTransactions;

// Export categories for use in other files
export const CATEGORIES = [
  'Income',
  'Food & Dining',
  'Transportation',
  'Housing',
  'Entertainment',
  'Shopping',
  'Miscellaneous'
];

// Get recent transactions
export const getRecentTransactions = (count: number = 5): Transaction[] => {
  return [...mockTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};

// Generate mock chart data for dashboard
export const generateChartData = () => {
  return [
    { name: 'Jan', income: 4000, expense: 2400 },
    { name: 'Feb', income: 3000, expense: 1398 },
    { name: 'Mar', income: 2000, expense: 9800 },
    { name: 'Apr', income: 2780, expense: 3908 },
    { name: 'May', income: 1890, expense: 4800 },
    { name: 'Jun', income: 2390, expense: 3800 },
  ];
};
