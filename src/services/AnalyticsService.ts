
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/formatters';
import { groupByMonth } from '@/lib/formatters';

export interface AnalyticsTotals {
  income: number;
  expenses: number;
  savingsRate: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface MonthlyData {
  month: string;
  total: number;
}

export class AnalyticsService {
  // Get expense and income totals
  static getTotals(transactions: Transaction[]): AnalyticsTotals {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    return { income, expenses, savingsRate };
  }

  // Generate data for the category breakdown chart
  static getCategoryData(transactions: Transaction[]): CategoryData[] {
    const expensesByCategory = transactions
      .filter(t => t.amount < 0)
      .reduce((acc: Record<string, number>, transaction) => {
        const { category, amount } = transaction;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(amount);
        return acc;
      }, {});

    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  // Generate data for the subcategory breakdown chart
  static getSubcategoryData(transactions: Transaction[]): CategoryData[] {
    const expensesBySubcategory = transactions
      .filter(t => t.amount < 0 && t.subcategory)
      .reduce((acc: Record<string, number>, transaction) => {
        const sub = transaction.subcategory as string;
        if (!acc[sub]) {
          acc[sub] = 0;
        }
        acc[sub] += Math.abs(transaction.amount);
        return acc;
      }, {});

    return Object.entries(expensesBySubcategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  // Generate data for the monthly spending chart
  static getMonthlyData(transactions: Transaction[]): MonthlyData[] {
    // Filter out transactions that don't have a date field or have amount >= 0
    const validTransactions = transactions
      .filter(t => t.amount < 0 && t.date);
    
    // Now we can safely pass these to groupByMonth
    const grouped = groupByMonth(validTransactions);
    
    return Object.entries(grouped).map(([month, txns]) => {
      const total = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      // Format month for display (YYYY-MM -> MMM YYYY)
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const formatted = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        month: formatted,
        total,
      };
    }).sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }

  // Get all unique expense categories
  static getUniqueCategories(transactions: Transaction[]): string[] {
    return Array.from(new Set(
      transactions
        .filter(t => t.amount < 0)
        .map(t => t.category)
    ));
  }

  // Calculate top spending categories
  static getTopCategories(categoryData: CategoryData[], limit: number = 3): CategoryData[] {
    return [...categoryData]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }
}
