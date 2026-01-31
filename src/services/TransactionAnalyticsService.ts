/**
 * @file TransactionAnalyticsService.ts
 * @description Computes high-level transaction summaries, category rollups,
 *              and time-series aggregates for charts.
 *
 * @module services/TransactionAnalyticsService
 *
 * @responsibilities
 * 1. Calculate income/expense/balance totals (excluding transfers)
 * 2. Aggregate expenses by category for pie charts
 * 3. Aggregate income/expense by time period for trend charts
 *
 * @dependencies
 * - storage-utils.ts: getStoredTransactions
 *
 * @review-tags
 * - @risk: transfer exclusion must be consistent with UI expectations
 * - @performance: iterates over full transaction list per call
 *
 * @review-checklist
 * - [ ] Transfers excluded from summaries and category totals
 * - [ ] Date bucketing aligns with chart period (week/month/year)
 */

import { Transaction, TransactionSummary, CategorySummary, TimePeriodData, TimePeriod } from '@/types/transaction';
import { getStoredTransactions } from '@/utils/storage-utils';

export class TransactionAnalyticsService {
  // Get transactions summary statistics (EXCLUDES transfers)
  getTransactionsSummary(): TransactionSummary {
    const transactions = getStoredTransactions();
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }

  // Get transactions grouped by category (EXCLUDES transfers)
  getTransactionsByCategory(): CategorySummary[] {
    const transactions = getStoredTransactions();
    const categories: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + Math.abs(t.amount);
      });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }

  // Get transactions grouped by time period (EXCLUDES transfers)
  getTransactionsByTimePeriod(period: TimePeriod = 'month'): TimePeriodData[] {
    const transactions = getStoredTransactions();
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
    
    // Fill in the actual data (SKIP transfers)
    transactions.forEach(t => {
      // Skip transfers entirely
      if (t.type === 'transfer') return;
      
      const date = new Date(t.date);
      const key = getDateKey(date);
      
      if (timelineData[key]) {
        if (t.type === 'income') {
          timelineData[key].income += Math.abs(t.amount);
        } else if (t.type === 'expense') {
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
