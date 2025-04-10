
import { Transaction, CategorySummary, TimePeriodData } from '@/types/transaction';

// Example transactions for development
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Salary',
    amount: 5000,
    category: 'Income',
    date: '2023-04-01',
    type: 'income',
    fromAccount: 'Bank Account',
    source: 'manual',
  },
  {
    id: '2',
    title: 'Rent',
    amount: -1500,
    category: 'Housing',
    date: '2023-04-02',
    type: 'expense',
    fromAccount: 'Bank Account',
    source: 'manual',
  },
  {
    id: '3',
    title: 'Groceries',
    amount: -200,
    category: 'Food',
    date: '2023-04-03',
    type: 'expense',
    fromAccount: 'Credit Card',
    source: 'manual',
  },
  {
    id: '4',
    title: 'Internet Bill',
    amount: -80,
    category: 'Utilities',
    date: '2023-04-05',
    type: 'expense',
    fromAccount: 'Bank Account',
    source: 'manual',
  },
  {
    id: '5',
    title: 'Dinner',
    amount: -50,
    category: 'Food',
    date: '2023-04-10',
    type: 'expense',
    fromAccount: 'Cash',
    source: 'manual',
  },
  {
    id: '6',
    title: 'Gas',
    amount: -45,
    category: 'Transportation',
    date: '2023-04-12',
    type: 'expense',
    fromAccount: 'Credit Card',
    source: 'manual',
  },
  {
    id: '7',
    title: 'Freelance Work',
    amount: 1000,
    category: 'Income',
    date: '2023-04-15',
    type: 'income',
    fromAccount: 'Bank Account',
    source: 'manual',
  },
  {
    id: '8',
    title: 'Coffee',
    amount: -5,
    category: 'Food',
    date: '2023-04-20',
    type: 'expense',
    fromAccount: 'Cash',
    source: 'manual',
  }
];

// For use in demo and testing components
export const INITIAL_TRANSACTIONS = mockTransactions;

// List of categories for dropdowns and filters
export const CATEGORIES = [
  'Income', 
  'Housing', 
  'Food', 
  'Transportation', 
  'Utilities', 
  'Entertainment', 
  'Shopping', 
  'Health', 
  'Education', 
  'Personal', 
  'Travel', 
  'Gifts', 
  'Investments', 
  'Other'
];

/**
 * Generates chart data from transactions for analytics
 * @param transactions Array of transactions to process
 * @returns Object containing chartData and timelineData
 */
export const generateChartData = (transactions: Transaction[]) => {
  // Generate category summary data for pie/bar charts
  const categoryData: CategorySummary[] = [];
  const categoryMap: Record<string, number> = {};
  
  // Generate timeline data for line charts
  const timelineData: TimePeriodData[] = [];
  const timelineMap: Record<string, { income: number; expense: number }> = {};
  
  try {
    // Process each transaction
    transactions.forEach((tx) => {
      if (!tx) return;
      
      // For category breakdown
      if (tx.type === 'expense' && tx.category) {
        const category = tx.category;
        const amount = Math.abs(tx.amount);
        
        if (categoryMap[category]) {
          categoryMap[category] += amount;
        } else {
          categoryMap[category] = amount;
        }
      }
      
      // For timeline
      try {
        const date = new Date(tx.date);
        const month = date.toISOString().substring(0, 7); // YYYY-MM format
        
        if (!timelineMap[month]) {
          timelineMap[month] = { income: 0, expense: a0 };
        }
        
        if (tx.amount > 0) {
          timelineMap[month].income += tx.amount;
        } else {
          timelineMap[month].expense += Math.abs(tx.amount);
        }
      } catch (error) {
        console.error('Error processing transaction date:', error);
      }
    });
    
    // Convert category map to array
    Object.entries(categoryMap).forEach(([name, value]) => {
      categoryData.push({ name, value });
    });
    
    // Sort categoryData by value in descending order
    categoryData.sort((a, b) => b.value - a.value);
    
    // Convert timeline map to array
    Object.entries(timelineMap).forEach(([date, values]) => {
      timelineData.push({
        date,
        income: values.income,
        expense: values.expense,
      });
    });
    
    // Sort timeline data by date
    timelineData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return { categoryData, timelineData };
  } catch (error) {
    console.error('Error generating chart data:', error);
    return { categoryData: [], timelineData: [] };
  }
};
