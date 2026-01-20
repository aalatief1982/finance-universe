import { describe, expect, it } from 'vitest';
import { AnalyticsService } from '../AnalyticsService';
import { Transaction } from '@/types/transaction';

describe('AnalyticsService', () => {
  // Helper to create a basic transaction
  const createTransaction = (
    overrides: Partial<Transaction> = {}
  ): Transaction => ({
    id: Math.random().toString(),
    title: 'Test Transaction',
    amount: 100,
    category: 'General',
    date: '2024-01-15',
    type: 'expense',
    source: 'manual',
    ...overrides,
  });

  describe('getTotals', () => {
    it('calculates income total from type === "income" only', () => {
      const transactions = [
        createTransaction({ type: 'income', amount: 1000 }),
        createTransaction({ type: 'income', amount: 500 }),
        createTransaction({ type: 'expense', amount: -200 }),
      ];

      const result = AnalyticsService.getTotals(transactions);
      expect(result.income).toBe(1500);
    });

    it('calculates expense total from type === "expense" only', () => {
      const transactions = [
        createTransaction({ type: 'income', amount: 1000 }),
        createTransaction({ type: 'expense', amount: -200 }),
        createTransaction({ type: 'expense', amount: -300 }),
      ];

      const result = AnalyticsService.getTotals(transactions);
      expect(result.expenses).toBe(500);
    });

    it('EXCLUDES transfers from both income and expenses', () => {
      const transactions = [
        createTransaction({ type: 'income', amount: 1000 }),
        createTransaction({ type: 'expense', amount: -200 }),
        // These transfers should be excluded
        createTransaction({
          type: 'transfer',
          amount: -500,
          transferId: 'abc',
          transferDirection: 'out',
        }),
        createTransaction({
          type: 'transfer',
          amount: 500,
          transferId: 'abc',
          transferDirection: 'in',
        }),
      ];

      const result = AnalyticsService.getTotals(transactions);
      expect(result.income).toBe(1000); // Only the income
      expect(result.expenses).toBe(200); // Only the expense
    });

    it('calculates savings rate correctly', () => {
      const transactions = [
        createTransaction({ type: 'income', amount: 1000 }),
        createTransaction({ type: 'expense', amount: -400 }),
      ];

      const result = AnalyticsService.getTotals(transactions);
      // Savings = (1000 - 400) / 1000 * 100 = 60%
      expect(result.savingsRate).toBe(60);
    });

    it('returns 0 savings rate when no income', () => {
      const transactions = [
        createTransaction({ type: 'expense', amount: -400 }),
      ];

      const result = AnalyticsService.getTotals(transactions);
      expect(result.savingsRate).toBe(0);
    });
  });

  describe('getCategoryData', () => {
    it('includes only type === "expense" transactions', () => {
      const transactions = [
        createTransaction({ type: 'expense', category: 'Food', amount: -100 }),
        createTransaction({ type: 'income', category: 'Salary', amount: 1000 }),
      ];

      const result = AnalyticsService.getCategoryData(transactions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Food');
    });

    it('EXCLUDES transfers from category data', () => {
      const transactions = [
        createTransaction({ type: 'expense', category: 'Food', amount: -100 }),
        createTransaction({
          type: 'transfer',
          category: 'Transfer',
          amount: -500,
          transferId: 'abc',
          transferDirection: 'out',
        }),
      ];

      const result = AnalyticsService.getCategoryData(transactions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Food');
    });

    it('aggregates expenses by category correctly', () => {
      const transactions = [
        createTransaction({ type: 'expense', category: 'Food', amount: -100 }),
        createTransaction({ type: 'expense', category: 'Food', amount: -50 }),
        createTransaction({ type: 'expense', category: 'Transport', amount: -30 }),
      ];

      const result = AnalyticsService.getCategoryData(transactions);
      const food = result.find(c => c.name === 'Food');
      const transport = result.find(c => c.name === 'Transport');

      expect(food?.value).toBe(150);
      expect(transport?.value).toBe(30);
    });

    it('sorts categories by value descending', () => {
      const transactions = [
        createTransaction({ type: 'expense', category: 'Small', amount: -10 }),
        createTransaction({ type: 'expense', category: 'Large', amount: -500 }),
        createTransaction({ type: 'expense', category: 'Medium', amount: -100 }),
      ];

      const result = AnalyticsService.getCategoryData(transactions);
      expect(result[0].name).toBe('Large');
      expect(result[1].name).toBe('Medium');
      expect(result[2].name).toBe('Small');
    });
  });

  describe('getSubcategoryData', () => {
    it('includes only expenses with subcategories', () => {
      const transactions = [
        createTransaction({
          type: 'expense',
          category: 'Food',
          subcategory: 'Restaurants',
          amount: -100,
        }),
        createTransaction({
          type: 'expense',
          category: 'Food',
          // No subcategory
          amount: -50,
        }),
        createTransaction({
          type: 'income',
          category: 'Salary',
          subcategory: 'Bonus',
          amount: 500,
        }),
      ];

      const result = AnalyticsService.getSubcategoryData(transactions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Restaurants');
    });

    it('EXCLUDES transfers from subcategory data', () => {
      const transactions = [
        createTransaction({
          type: 'expense',
          category: 'Food',
          subcategory: 'Groceries',
          amount: -100,
        }),
        createTransaction({
          type: 'transfer',
          category: 'Transfer',
          subcategory: 'Internal',
          amount: -500,
          transferId: 'abc',
          transferDirection: 'out',
        }),
      ];

      const result = AnalyticsService.getSubcategoryData(transactions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Groceries');
    });
  });

  describe('getMonthlyData', () => {
    it('groups expenses by month', () => {
      const transactions = [
        createTransaction({ type: 'expense', date: '2024-01-15', amount: -100 }),
        createTransaction({ type: 'expense', date: '2024-01-20', amount: -50 }),
        createTransaction({ type: 'expense', date: '2024-02-10', amount: -200 }),
      ];

      const result = AnalyticsService.getMonthlyData(transactions);
      expect(result).toHaveLength(2);

      const jan = result.find(m => m.month.includes('Jan'));
      const feb = result.find(m => m.month.includes('Feb'));

      expect(jan?.total).toBe(150);
      expect(feb?.total).toBe(200);
    });

    it('EXCLUDES transfers from monthly data', () => {
      const transactions = [
        createTransaction({ type: 'expense', date: '2024-01-15', amount: -100 }),
        createTransaction({
          type: 'transfer',
          date: '2024-01-15',
          amount: -500,
          transferId: 'abc',
          transferDirection: 'out',
        }),
      ];

      const result = AnalyticsService.getMonthlyData(transactions);
      expect(result).toHaveLength(1);
      expect(result[0].total).toBe(100);
    });

    it('sorts monthly data chronologically', () => {
      const transactions = [
        createTransaction({ type: 'expense', date: '2024-03-15', amount: -100 }),
        createTransaction({ type: 'expense', date: '2024-01-15', amount: -100 }),
        createTransaction({ type: 'expense', date: '2024-02-15', amount: -100 }),
      ];

      const result = AnalyticsService.getMonthlyData(transactions);
      expect(result[0].month).toContain('Jan');
      expect(result[1].month).toContain('Feb');
      expect(result[2].month).toContain('Mar');
    });
  });

  describe('getUniqueCategories', () => {
    it('returns unique expense categories only', () => {
      const transactions = [
        createTransaction({ type: 'expense', category: 'Food' }),
        createTransaction({ type: 'expense', category: 'Food' }),
        createTransaction({ type: 'expense', category: 'Transport' }),
        createTransaction({ type: 'income', category: 'Salary' }),
      ];

      const result = AnalyticsService.getUniqueCategories(transactions);
      expect(result).toHaveLength(2);
      expect(result).toContain('Food');
      expect(result).toContain('Transport');
      expect(result).not.toContain('Salary');
    });

    it('EXCLUDES transfer categories', () => {
      const transactions = [
        createTransaction({ type: 'expense', category: 'Food' }),
        createTransaction({
          type: 'transfer',
          category: 'Transfer',
          transferId: 'abc',
        }),
      ];

      const result = AnalyticsService.getUniqueCategories(transactions);
      expect(result).toHaveLength(1);
      expect(result).not.toContain('Transfer');
    });
  });

  describe('getTopCategories', () => {
    it('returns top categories by value', () => {
      const categoryData = [
        { name: 'Small', value: 10 },
        { name: 'Large', value: 500 },
        { name: 'Medium', value: 100 },
        { name: 'Tiny', value: 5 },
      ];

      const result = AnalyticsService.getTopCategories(categoryData, 2);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Large');
      expect(result[1].name).toBe('Medium');
    });

    it('defaults to top 3 when limit not specified', () => {
      const categoryData = [
        { name: 'A', value: 100 },
        { name: 'B', value: 200 },
        { name: 'C', value: 300 },
        { name: 'D', value: 400 },
      ];

      const result = AnalyticsService.getTopCategories(categoryData);
      expect(result).toHaveLength(3);
    });
  });
});
