
import { Transaction } from '@/types/transaction';

// Define chart data interface to match what DashboardContent expects
export interface ChartData {
  categoryData: { name: string; value: number }[];
  timelineData: { name: string; value: number }[];
}

// Add categories for components that need them
export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Travel',
  'Healthcare',
  'Education',
  'Miscellaneous',
  'Income',
  'Transfer'
];

// Add initial transactions for components that need them
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const generateChartData = (transactions: Transaction[]): ChartData => {
  // Generate data for category chart
  const categoryMap = new Map<string, number>();
  transactions.forEach(tx => {
    if (tx.amount < 0) { // Only consider expenses
      const category = tx.category || 'Uncategorized';
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + Math.abs(tx.amount));
    }
  });
  
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
  
  // Generate timeline data (last 7 days)
  const today = new Date();
  const timelineData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    
    // Filter transactions for this day
    const dayTotal = transactions
      .filter(tx => tx.date.startsWith(dayStr) && tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    timelineData.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: dayTotal
    });
  }
  
  return { categoryData, timelineData };
};
