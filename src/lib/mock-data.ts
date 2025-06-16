
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

// Generate chart data for different periods
export const generateChartData = (period: 'week' | 'month' | 'year' = 'month') => {
  const data = [];
  const now = new Date();
  
  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        income: Math.floor(Math.random() * 1000) + 500,
        expenses: Math.floor(Math.random() * 800) + 300,
      });
    }
  } else if (period === 'month') {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        name: date.getDate().toString(),
        income: Math.floor(Math.random() * 1000) + 500,
        expenses: Math.floor(Math.random() * 800) + 300,
      });
    }
  } else {
    // year
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        income: Math.floor(Math.random() * 10000) + 5000,
        expenses: Math.floor(Math.random() * 8000) + 3000,
      });
    }
  }
  
  return data;
};

// Mock transactions for testing
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Grocery Shopping',
    amount: 125.50,
    currency: 'SAR' as SupportedCurrency,
    type: TransactionType.EXPENSE,
    category: 'Food & Dining',
    subcategory: 'Groceries',
    date: new Date().toISOString(),
    vendor: 'Panda',
    fromAccount: 'Main Account',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Salary',
    amount: 5000,
    currency: 'SAR' as SupportedCurrency,
    type: TransactionType.INCOME,
    category: 'Income',
    subcategory: 'Salary',
    date: new Date().toISOString(),
    vendor: 'Company',
    fromAccount: 'Main Account',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
