
import { Transaction, TransactionSummary, CategorySummary, TimePeriodData, TimePeriod } from '@/types/transaction';
import { transactionStore } from '@/state/transactionStore';

export class TransactionAnalyticsService {
  // Get transactions summary statistics
  getTransactionsSummary(): TransactionSummary {
    const transactions = transactionStore.get();
    
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }

  // Get transactions grouped by category
  getTransactionsByCategory(): CategorySummary[] {
    const transactions = transactionStore.get();
    const categories: Record<string, number> = {};
    
    transactions
      .filter(t => t.amount < 0) // Only include expenses
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + Math.abs(t.amount);
      });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }

  // Get transactions grouped by time period
  getTransactionsByTimePeriod(period: TimePeriod = 'month'): TimePeriodData[] {
    const transactions = transactionStore.get();
    const timelineData: Record<string, { income: number; expense: number }> = {};
    
    // Get date format based on period
    const getDateKey = (date: Date) => {
      if (period === 'week') {
        // Format as 'Mon', 'Tue', etc.
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (period === 'month') {
        // Format as day of month: '1', '2', etc.
        return date.getDate().toString();
      } else {
        // Format as 'Jan', 'Feb', etc.
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
    };
    
    // Initialize the timeline data structure
    const now = new Date();
    const dataPoints = period === 'week' ? 7 : period === 'month' ? 31 : 12;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      
      if (period === 'week') {
        date.setDate(now.getDate() - (now.getDay() - i));
      } else if (period === 'month') {
        date.setDate(i + 1);
      } else {
        date.setMonth(i);
      }
      
      const key = getDateKey(date);
      timelineData[key] = { income: 0, expense: 0 };
    }
    
    // Fill in the actual data
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = getDateKey(date);
      
      if (timelineData[key]) {
        if (t.amount >= 0) {
          timelineData[key].income += t.amount;
        } else {
          timelineData[key].expense += Math.abs(t.amount);
        }
      }
    });
    
    // Convert to array format for charts
    return Object.entries(timelineData).map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense
    }));
  }
}

// Export a singleton instance
export const transactionAnalyticsService = new TransactionAnalyticsService();
