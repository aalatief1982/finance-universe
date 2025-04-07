
import { Transaction } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

// Create mock transactions for development
export const mockTransactions: Transaction[] = [
  {
    id: uuidv4(),
    title: 'Grocery Shopping',
    amount: -120.50,
    category: 'groceries',
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
    date: '2023-04-05T10:00:00Z',
    type: 'expense',
    notes: 'Monthly electricity bill',
    source: 'manual',
    fromAccount: 'Main Account',
    currency: 'USD'
  }
];

// Get recent transactions
export const getRecentTransactions = (count: number = 5): Transaction[] => {
  return [...mockTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};
