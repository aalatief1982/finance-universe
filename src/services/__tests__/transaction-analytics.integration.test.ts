import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import { Transaction } from '@/types/transaction';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Mock firebase analytics
vi.mock('@/utils/firebase-analytics', () => ({
  logAnalyticsEvent: vi.fn(),
}));

// Import after mocks
import { transactionService } from '../TransactionService';
import { AnalyticsService } from '../AnalyticsService';

describe('Transaction + Analytics Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('Adding transactions updates analytics correctly', () => {
    it('should update income totals when adding income transaction', () => {
      // Add income transaction
      transactionService.addTransaction({
        title: 'Salary',
        amount: 5000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        fromAccount: 'Bank',
        currency: 'USD',
        source: 'manual',
      });

      const transactions = transactionService.getAllTransactions();
      const totals = AnalyticsService.getTotals(transactions);

      expect(totals.income).toBe(5000);
      expect(totals.expenses).toBe(0);
    });

    it('should update expense totals when adding expense transaction', () => {
      // Add expense transaction
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -150,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const transactions = transactionService.getAllTransactions();
      const totals = AnalyticsService.getTotals(transactions);

      expect(totals.income).toBe(0);
      expect(totals.expenses).toBe(150);
    });

    it('should NOT include transfers in income or expense totals', () => {
      // Add income first
      transactionService.addTransaction({
        title: 'Salary',
        amount: 5000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        fromAccount: 'Bank',
        currency: 'USD',
        source: 'manual',
      });

      // Add a transfer (creates dual entries)
      transactionService.addTransaction({
        title: 'Transfer to Savings',
        amount: 1000,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-16',
        fromAccount: 'Bank',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      const transactions = transactionService.getAllTransactions();
      const totals = AnalyticsService.getTotals(transactions);

      // Transfer should NOT affect totals
      expect(totals.income).toBe(5000);
      expect(totals.expenses).toBe(0);
      expect(transactions.length).toBe(3); // 1 income + 2 transfer entries
    });

    it('should calculate correct savings rate excluding transfers', () => {
      // Add income
      transactionService.addTransaction({
        title: 'Salary',
        amount: 10000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        fromAccount: 'Bank',
        currency: 'USD',
        source: 'manual',
      });

      // Add expense
      transactionService.addTransaction({
        title: 'Rent',
        amount: -2000,
        type: 'expense',
        category: 'Housing',
        date: '2024-01-15',
        fromAccount: 'Bank',
        currency: 'USD',
        source: 'manual',
      });

      // Add transfer (should not affect savings rate)
      transactionService.addTransaction({
        title: 'Transfer',
        amount: 3000,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-16',
        fromAccount: 'Bank',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      const transactions = transactionService.getAllTransactions();
      const totals = AnalyticsService.getTotals(transactions);

      // Savings rate = (10000 - 2000) / 10000 * 100 = 80%
      expect(totals.savingsRate).toBe(80);
    });
  });

  describe('Category breakdown excludes transfers', () => {
    it('should only include expenses in category data', () => {
      // Add expense in Food
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      // Add expense in Transport
      transactionService.addTransaction({
        title: 'Uber',
        amount: -50,
        type: 'expense',
        category: 'Transport',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      // Add transfer
      transactionService.addTransaction({
        title: 'Transfer',
        amount: 500,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-16',
        fromAccount: 'Bank',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      const transactions = transactionService.getAllTransactions();
      const categoryData = AnalyticsService.getCategoryData(transactions);

      // Should have Food and Transport, NOT Transfer
      expect(categoryData.length).toBe(2);
      expect(categoryData.find(c => c.name === 'Food')?.value).toBe(100);
      expect(categoryData.find(c => c.name === 'Transport')?.value).toBe(50);
      expect(categoryData.find(c => c.name === 'Transfer')).toBeUndefined();
    });

    it('should aggregate multiple expenses in same category', () => {
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      transactionService.addTransaction({
        title: 'Restaurant',
        amount: -75,
        type: 'expense',
        category: 'Food',
        date: '2024-01-16',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const transactions = transactionService.getAllTransactions();
      const categoryData = AnalyticsService.getCategoryData(transactions);

      expect(categoryData.find(c => c.name === 'Food')?.value).toBe(175);
    });
  });

  describe('Deleting transactions updates analytics', () => {
    it('should reduce totals when transaction is deleted', () => {
      // Add two expenses
      const tx1 = transactionService.addTransaction({
        title: 'Expense 1',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      }) as Transaction;

      transactionService.addTransaction({
        title: 'Expense 2',
        amount: -50,
        type: 'expense',
        category: 'Food',
        date: '2024-01-16',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      // Delete first expense
      transactionService.deleteTransaction(tx1.id);

      const transactions = transactionService.getAllTransactions();
      const totals = AnalyticsService.getTotals(transactions);

      expect(totals.expenses).toBe(50);
    });

    it('should remove transfer from analytics when deleted', () => {
      transactionService.addTransaction({
        title: 'Income',
        amount: 1000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        fromAccount: 'Bank',
        currency: 'USD',
        source: 'manual',
      });

      const transferResult = transactionService.addTransaction({
        title: 'Transfer',
        amount: 500,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-16',
        fromAccount: 'Bank',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      }) as Transaction[];

      // Verify 3 transactions exist (1 income + 2 transfer entries)
      expect(transactionService.getAllTransactions().length).toBe(3);

      // Delete one half of transfer (should delete both)
      transactionService.deleteTransaction(transferResult[0].id);

      const transactions = transactionService.getAllTransactions();
      const totals = AnalyticsService.getTotals(transactions);

      expect(transactions.length).toBe(1);
      expect(totals.income).toBe(1000);
    });
  });

  describe('Monthly data excludes transfers', () => {
    it('should group expenses by month and exclude transfers', () => {
      // Add expenses in different months
      transactionService.addTransaction({
        title: 'Jan Expense',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      transactionService.addTransaction({
        title: 'Feb Expense',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: '2024-02-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      // Add transfer in January
      transactionService.addTransaction({
        title: 'Transfer',
        amount: 500,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-20',
        fromAccount: 'Bank',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      const transactions = transactionService.getAllTransactions();
      const monthlyData = AnalyticsService.getMonthlyData(transactions);

      // Should have 2 months
      expect(monthlyData.length).toBe(2);
      
      // January should only have 100 (not 500 from transfer)
      const jan = monthlyData.find(m => m.month.includes('Jan'));
      expect(jan?.total).toBe(100);

      const feb = monthlyData.find(m => m.month.includes('Feb'));
      expect(feb?.total).toBe(200);
    });
  });
});
