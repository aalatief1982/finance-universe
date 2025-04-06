
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';

// Generate a random date within the last 30 days
const getRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  now.setDate(now.getDate() - daysAgo);
  return now.toISOString().split('T')[0];
};

export const CATEGORIES = [
  'Food', 
  'Transportation', 
  'Entertainment', 
  'Shopping', 
  'Utilities',
  'Housing',
  'Healthcare',
  'Education',
  'Travel',
  'Gifts',
  'Personal Care',
  'Subscriptions',
  'Other'
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: uuidv4(),
    title: 'Salary',
    amount: 3500,
    category: 'Income',
    date: getRandomDate(),
    type: 'income',
    fromAccount: 'Bank Account', // Add fromAccount to all transactions
  },
  {
    id: uuidv4(),
    title: 'Rent',
    amount: -1200,
    category: 'Housing',
    date: getRandomDate(),
    type: 'expense',
    fromAccount: 'Bank Account', 
  },
  {
    id: uuidv4(),
    title: 'Groceries',
    amount: -85.45,
    category: 'Food',
    date: getRandomDate(),
    type: 'expense',
    fromAccount: 'Credit Card',
  },
  {
    id: uuidv4(),
    title: 'Uber Rides',
    amount: -32.99,
    category: 'Transportation',
    date: getRandomDate(),
    type: 'expense',
    fromAccount: 'Credit Card',
  },
  {
    id: uuidv4(),
    title: 'Netflix Subscription',
    amount: -14.99,
    category: 'Subscriptions',
    date: getRandomDate(),
    type: 'expense',
    fromAccount: 'Bank Account',
  },
  {
    id: uuidv4(),
    title: 'Restaurant Dinner',
    amount: -58.75,
    category: 'Food',
    date: getRandomDate(),
    type: 'expense',
    fromAccount: 'Credit Card',
  },
  {
    id: uuidv4(),
    title: 'Freelance Work',
    amount: 450,
    category: 'Income',
    date: getRandomDate(),
    type: 'income',
    fromAccount: 'Bank Account',
  },
  {
    id: uuidv4(),
    title: 'Shopping - Clothes',
    amount: -123.45,
    category: 'Shopping',
    date: getRandomDate(),
    type: 'expense',
    fromAccount: 'Credit Card',
  },
];

// Generate data for charts
export const generateChartData = (transactions: Transaction[]) => {
  // Category chart data
  const expensesByCategory = transactions
    .filter(t => t.amount < 0)
    .reduce((acc: Record<string, number>, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(item.amount);
      return acc;
    }, {});

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Timeline chart data
  const sortedTransactions = [...transactions]
    .filter(t => t.amount < 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const expensesByDate = sortedTransactions.map(t => ({
    date: t.date.slice(5), // MM-DD format
    amount: t.amount,
  }));

  return {
    categoryData,
    timelineData: expensesByDate,
  };
};
