/**
 * @file AnalyticsService.ts
 * @description Pure analytics helpers for totals, category breakdowns,
 *              and time-series data used by dashboard charts.
 *
 * @module services/AnalyticsService
 *
 * @responsibilities
 * 1. Compute income/expense totals and savings rate (transfer-excluded)
 * 2. Build category/subcategory rollups for charts
 * 3. Aggregate monthly totals for trend displays
 * 4. FX-aware aggregation using amountInBase for multi-currency support
 *
 * @dependencies
 * - formatters.ts: formatCurrency, groupByMonth
 *
 * @review-tags
 * - @risk: transfer exclusion affects summary correctness
 * - @risk: FX aggregation must handle null amountInBase gracefully
 * - @performance: groupByMonth iterates over filtered transactions
 *
 * @review-checklist
 * - [ ] Transfers excluded from all analytics outputs
 * - [ ] Subcategory totals ignore NaN/Infinity values
 * - [ ] Month sorting uses actual dates, not strings
 * - [ ] FX totals track unconverted transactions separately
 */

import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/formatters';
import { groupByMonth } from '@/lib/formatters';

export interface AnalyticsTotals {
  income: number;
  expenses: number;
  savingsRate: number;
}

/**
 * FX-aware totals that track unconverted transactions
 */
export interface FxAwareTotals extends AnalyticsTotals {
  /** Number of transactions with missing amountInBase */
  unconvertedCount: number;
  /** Currencies that couldn't be converted */
  unconvertedCurrencies: string[];
  /** Native amounts by currency for unconverted transactions */
  unconvertedByNative: Record<string, { income: number; expenses: number }>;
  /** Whether all transactions are fully converted */
  isFullyConverted: boolean;
}

export interface CategoryData {
  name: string;
  value: number;
  [key: string]: unknown;
}

/**
 * FX-aware category data
 */
export interface FxAwareCategoryData extends CategoryData {
  /** Native currency amounts for unconverted */
  unconvertedAmount?: number;
  unconvertedCurrency?: string;
}

export interface MonthlyData {
  month: string;
  total: number;
  [key: string]: unknown;
}

export class AnalyticsService {
  // Get expense and income totals (EXCLUDES transfers)
  static getTotals(transactions: Transaction[]): AnalyticsTotals {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    return { income, expenses, savingsRate };
  }

  /**
   * Get FX-aware totals using amountInBase when available.
   * Tracks unconverted transactions separately.
   * EXCLUDES transfers from all calculations.
   * 
   * @param transactions - Array of transactions to aggregate
   * @param baseCurrency - User's base currency for context
   * @returns FxAwareTotals with conversion status
   */
  static getFxAwareTotals(transactions: Transaction[], baseCurrency: string): FxAwareTotals {
    let income = 0;
    let expenses = 0;
    let unconvertedCount = 0;
    const unconvertedCurrenciesSet = new Set<string>();
    const unconvertedByNative: Record<string, { income: number; expenses: number }> = {};
    const normalizedBase = baseCurrency.toUpperCase();

    transactions.forEach(t => {
      // Skip transfers - they don't affect income/expense totals
      if (t.type === 'transfer') return;

      // Smart fallback: handle pre-migration data where fxSource is undefined
      // If fxSource is undefined but currency matches base, treat as identity
      const txCurrency = (t.currency || normalizedBase).toUpperCase();
      const isBaseCurrencyMatch = txCurrency === normalizedBase;
      
      const hasValidConversion = 
        (t.amountInBase != null && t.fxSource !== 'missing') ||
        (t.fxSource === undefined && isBaseCurrencyMatch);
      
      if (hasValidConversion) {
        // Use converted amount, or fall back to amount for unmigrated base-currency txns
        const effectiveAmount = t.amountInBase ?? t.amount;
        if (t.type === 'income') {
          income += Math.abs(effectiveAmount);
        } else if (t.type === 'expense') {
          expenses += Math.abs(effectiveAmount);
        }
      } else {
        // Track unconverted transaction (only foreign currency without rate)
        unconvertedCount++;
        const currency = t.currency || 'Unknown';
        unconvertedCurrenciesSet.add(currency);
        
        if (!unconvertedByNative[currency]) {
          unconvertedByNative[currency] = { income: 0, expenses: 0 };
        }
        
        if (t.type === 'income') {
          unconvertedByNative[currency].income += Math.abs(t.amount);
        } else if (t.type === 'expense') {
          unconvertedByNative[currency].expenses += Math.abs(t.amount);
        }
      }
    });

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return {
      income,
      expenses,
      savingsRate,
      unconvertedCount,
      unconvertedCurrencies: Array.from(unconvertedCurrenciesSet),
      unconvertedByNative,
      isFullyConverted: unconvertedCount === 0,
    };
  }

  // Generate data for the category breakdown chart (EXCLUDES transfers)
  static getCategoryData(transactions: Transaction[]): CategoryData[] {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
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

  /**
   * Generate FX-aware category data using amountInBase.
   * EXCLUDES transfers from calculations.
   * 
   * @param transactions - Array of transactions
   * @returns Category data with base currency amounts
   */
  static getFxAwareCategoryData(transactions: Transaction[], baseCurrency?: string): FxAwareCategoryData[] {
    const categoryMap: Record<string, { 
      converted: number; 
      unconverted: number; 
      unconvertedCurrency?: string;
    }> = {};
    const normalizedBase = (baseCurrency || 'USD').toUpperCase();

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        
        if (!categoryMap[category]) {
          categoryMap[category] = { converted: 0, unconverted: 0 };
        }

        // Smart fallback for pre-migration data
        const txCurrency = (t.currency || normalizedBase).toUpperCase();
        const isBaseCurrencyMatch = txCurrency === normalizedBase;
        const hasValidConversion = 
          (t.amountInBase != null && t.fxSource !== 'missing') ||
          (t.fxSource === undefined && isBaseCurrencyMatch);
        
        if (hasValidConversion) {
          const effectiveAmount = t.amountInBase ?? t.amount;
          categoryMap[category].converted += Math.abs(effectiveAmount);
        } else {
          categoryMap[category].unconverted += Math.abs(t.amount);
          categoryMap[category].unconvertedCurrency = t.currency;
        }
      });

    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        value: data.converted,
        unconvertedAmount: data.unconverted > 0 ? data.unconverted : undefined,
        unconvertedCurrency: data.unconvertedCurrency,
      }))
      .sort((a, b) => b.value - a.value);
  }

  // Generate data for the subcategory breakdown chart (EXCLUDES transfers)
  static getSubcategoryData(transactions: Transaction[]): CategoryData[] {
    const expensesBySubcategory = transactions
      .filter(t => t.type === 'expense' && t.subcategory && !isNaN(t.amount))
      .reduce((acc: Record<string, number>, transaction) => {
        const sub = transaction.subcategory as string;
        if (!acc[sub]) {
          acc[sub] = 0;
        }
        const amount = Math.abs(transaction.amount);
        // Only add if the amount is a valid number
        if (!isNaN(amount) && isFinite(amount)) {
          acc[sub] += amount;
        }
        return acc;
      }, {});

    return Object.entries(expensesBySubcategory)
      .map(([name, value]) => ({ name, value }))
      .filter(({ value }) => !isNaN(value) && isFinite(value) && value > 0)
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Generate FX-aware subcategory data using amountInBase.
   * EXCLUDES transfers from calculations.
   */
  static getFxAwareSubcategoryData(transactions: Transaction[], baseCurrency?: string): FxAwareCategoryData[] {
    const subcategoryMap: Record<string, { 
      converted: number; 
      unconverted: number; 
      unconvertedCurrency?: string;
    }> = {};
    const normalizedBase = (baseCurrency || 'USD').toUpperCase();

    transactions
      .filter(t => t.type === 'expense' && t.subcategory && !isNaN(t.amount))
      .forEach(t => {
        const subcategory = t.subcategory as string;
        
        if (!subcategoryMap[subcategory]) {
          subcategoryMap[subcategory] = { converted: 0, unconverted: 0 };
        }

        // Smart fallback for pre-migration data
        const txCurrency = (t.currency || normalizedBase).toUpperCase();
        const isBaseCurrencyMatch = txCurrency === normalizedBase;
        const hasValidConversion = 
          (t.amountInBase != null && t.fxSource !== 'missing') ||
          (t.fxSource === undefined && isBaseCurrencyMatch);
        
        if (hasValidConversion) {
          const effectiveAmount = t.amountInBase ?? t.amount;
          const amount = Math.abs(effectiveAmount);
          if (!isNaN(amount) && isFinite(amount)) {
            subcategoryMap[subcategory].converted += amount;
          }
        } else {
          const amount = Math.abs(t.amount);
          if (!isNaN(amount) && isFinite(amount)) {
            subcategoryMap[subcategory].unconverted += amount;
            subcategoryMap[subcategory].unconvertedCurrency = t.currency;
          }
        }
      });

    return Object.entries(subcategoryMap)
      .map(([name, data]) => ({
        name,
        value: data.converted,
        unconvertedAmount: data.unconverted > 0 ? data.unconverted : undefined,
        unconvertedCurrency: data.unconvertedCurrency,
      }))
      .filter(({ value, unconvertedAmount }) => value > 0 || (unconvertedAmount && unconvertedAmount > 0))
      .sort((a, b) => b.value - a.value);
  }

  // Generate data for the monthly spending chart (EXCLUDES transfers)
  static getMonthlyData(transactions: Transaction[]): MonthlyData[] {
    // Filter out transactions that don't have a date field or are not expenses
    const validTransactions = transactions
      .filter(t => t.type === 'expense' && t.date);
    
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

  // Get all unique expense categories (EXCLUDES transfers)
  static getUniqueCategories(transactions: Transaction[]): string[] {
    return Array.from(new Set(
      transactions
        .filter(t => t.type === 'expense')
        .map(t => t.category)
    ));
  }

  // Calculate top spending categories
  static getTopCategories(categoryData: CategoryData[], limit: number = 3): CategoryData[] {
    return [...categoryData]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Get timeline data using amountInBase for FX-aware aggregation.
   * EXCLUDES transfers from calculations.
   * 
   * @param transactions - Array of transactions
   * @param range - Time range for bucketing ('day' | 'week' | 'month' | 'year')
   * @returns Timeline data with income/expense/balance per period
   */
  static getFxAwareTimelineData(
    transactions: Transaction[], 
    range: string,
    baseCurrency?: string
  ): Array<{ date: string; income: number; expense: number; balance: number; hasUnconverted?: boolean }> {
    const grouped = new Map<number, { 
      income: number; 
      expense: number; 
      hasUnconverted: boolean;
    }>();
    const normalizedBase = (baseCurrency || 'USD').toUpperCase();

    transactions.forEach((tx) => {
      // Skip transfers and invalid transactions
      if (!tx || tx.type === 'transfer') return;

      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;

      const bucket =
        range === 'year'
          ? new Date(d.getFullYear(), d.getMonth(), 1)
          : new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = bucket.getTime();

      const existing = grouped.get(key) || { income: 0, expense: 0, hasUnconverted: false };
      
      // Smart fallback for pre-migration data
      const txCurrency = (tx.currency || normalizedBase).toUpperCase();
      const isBaseCurrencyMatch = txCurrency === normalizedBase;
      const hasValidConversion = 
        (tx.amountInBase != null && tx.fxSource !== 'missing') ||
        (tx.fxSource === undefined && isBaseCurrencyMatch);
      
      const effectiveAmount = hasValidConversion 
        ? Math.abs(tx.amountInBase ?? tx.amount) 
        : Math.abs(tx.amount);

      if (tx.type === 'income') {
        existing.income += effectiveAmount;
      } else if (tx.type === 'expense') {
        existing.expense += effectiveAmount;
      }

      // Only flag as unconverted if truly missing (foreign currency without rate)
      if (!hasValidConversion && !isBaseCurrencyMatch) {
        existing.hasUnconverted = true;
      }

      grouped.set(key, existing);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, val]) => ({
        date: new Date(ts).toISOString(),
        income: val.income,
        expense: val.expense,
        balance: val.income - val.expense,
        hasUnconverted: val.hasUnconverted || undefined,
      }));
  }
}
