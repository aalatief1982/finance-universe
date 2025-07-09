
import { Transaction, CategorySummary, TimePeriodData } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

// Initial mock transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: uuidv4(),
    title: 'Salary',
    amount: 5000,
    category: 'Income',
    subcategory: 'Salary',
    date: '2023-04-01',
    type: 'income',
    fromAccount: 'Employer',
    toAccount: 'Bank Account',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  },
  {
    id: uuidv4(),
    title: 'Rent',
    amount: -1500,
    category: 'Housing',
    subcategory: 'Rent',
    date: '2023-04-02',
    type: 'expense',
    fromAccount: 'Bank Account',
    toAccount: 'Landlord',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  },
  {
    id: uuidv4(),
    title: 'Groceries',
    amount: -250,
    category: 'Food',
    subcategory: 'Grocery',
    date: '2023-04-05',
    type: 'expense',
    fromAccount: 'Bank Account',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  },
  {
    id: uuidv4(),
    title: 'Gas',
    amount: -45,
    category: 'Transportation',
    subcategory: 'Gas',
    date: '2023-04-07',
    type: 'expense',
    fromAccount: 'Credit Card',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  },
  {
    id: uuidv4(),
    title: 'Restaurant',
    amount: -85,
    category: 'Food',
    subcategory: 'Restaurant',
    date: '2023-04-10',
    type: 'expense',
    fromAccount: 'Credit Card',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  },
  {
    id: uuidv4(),
    title: 'Movie tickets',
    amount: -35,
    category: 'Entertainment',
    subcategory: 'Movies',
    date: '2023-04-15',
    type: 'expense',
    fromAccount: 'Cash',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  },
  {
    id: uuidv4(),
    title: 'Freelance work',
    amount: 750,
    category: 'Income',
    subcategory: 'Freelance',
    date: '2023-04-20',
    type: 'income',
    fromAccount: 'Client',
    toAccount: 'Bank Account',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  },
  {
    id: uuidv4(),
    title: 'Utility bills',
    amount: -120,
    category: 'Housing',
    subcategory: 'Utilities',
    date: '2023-04-25',
    type: 'expense',
    fromAccount: 'Bank Account',
    person: 'none',
    currency: 'USD',
    source: 'manual'
  }
];

export const PERSON_OPTIONS = [
  'none',
  'Ahmed',
  'Marwa',
  'Youssef',
  'Salma',
  'Mazen'
];

// Generate chart data based on transactions
export const generateChartData = (transactions: Transaction[]) => {
  // Calculate spending by category
  const expensesByCategory: Record<string, number> = {};
  transactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      const category = tx.category;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(tx.amount);
    });

  // Convert to array and sort by value
  const categoryData: CategorySummary[] = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate income and expenses by month
  const timeData: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(tx => {
    const monthYear = tx.date.substring(0, 7); // Format: YYYY-MM
    if (!timeData[monthYear]) {
      timeData[monthYear] = { income: 0, expense: 0 };
    }
    
    if (tx.type === 'income') {
      timeData[monthYear].income += Math.abs(tx.amount);
    } else if (tx.type === 'expense') {
      timeData[monthYear].expense += Math.abs(tx.amount);
    }
  });

  // Convert to array and sort by date
  const timelineData: TimePeriodData[] = Object.entries(timeData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { categoryData, timelineData };
};

// Default categories
export const CATEGORIES = [
  'Food',
  'Housing',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Personal',
  'Education',
  'Travel',
  'Income',
  'Gifts',
  'Investments',
  'Debt',
  'Insurance',
  'Taxes',
  'Miscellaneous'
];
