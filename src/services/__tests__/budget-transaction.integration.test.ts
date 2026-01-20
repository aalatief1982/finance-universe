import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import { Transaction } from '@/types/transaction';
import { Budget } from '@/models/budget';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Mock firebase analytics
vi.mock('@/utils/firebase-analytics', () => ({
  logAnalyticsEvent: vi.fn(),
}));

// Import after mocks
import { transactionService } from '../TransactionService';
import { BudgetService } from '../BudgetService';

describe('Budget + Transaction Integration', () => {
  let budgetService: BudgetService;

  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
    budgetService = new BudgetService();
  });

  describe('Overall budget tracking', () => {
    it('should track expenses against overall budget', () => {
      // Create overall budget for current month
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 1000,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      // Add expense for this month
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      expect(progress.budgeted).toBe(1000);
      expect(progress.spent).toBe(200);
      expect(progress.remaining).toBe(800);
      expect(progress.percentUsed).toBe(20);
      expect(progress.isOverBudget).toBe(false);
    });

    it('should detect over-budget condition', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 100,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      transactionService.addTransaction({
        title: 'Big expense',
        amount: -150,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      expect(progress.spent).toBe(150);
      expect(progress.remaining).toBe(0);
      expect(progress.isOverBudget).toBe(true);
      expect(progress.percentUsed).toBe(150);
    });

    it('should EXCLUDE transfers from overall budget spending', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 1000,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      // Add expense
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      // Add transfer (should NOT affect budget)
      transactionService.addTransaction({
        title: 'Transfer',
        amount: 500,
        type: 'transfer',
        category: 'Transfer',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Bank',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      // Only expense should be counted, not transfer
      expect(progress.spent).toBe(200);
      expect(progress.remaining).toBe(800);
    });
  });

  describe('Category budget tracking', () => {
    it('should track expenses against category budget', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'category',
        targetId: 'Food',
        amount: 500,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      // Add expense in Food category
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      // Add expense in different category (should not affect Food budget)
      transactionService.addTransaction({
        title: 'Gas',
        amount: -50,
        type: 'expense',
        category: 'Transport',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      expect(progress.spent).toBe(100);
      expect(progress.remaining).toBe(400);
    });

    it('should aggregate multiple expenses in same category', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'category',
        targetId: 'Food',
        amount: 500,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      transactionService.addTransaction({
        title: 'Groceries',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      transactionService.addTransaction({
        title: 'Restaurant',
        amount: -75,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      expect(progress.spent).toBe(175);
    });
  });

  describe('Budget alert thresholds', () => {
    it('should trigger alerts when thresholds are exceeded', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 1000,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        alertThresholds: [50, 75, 90, 100],
        isOverride: true,
      });

      // Add expense that exceeds 50% threshold
      transactionService.addTransaction({
        title: 'Big expense',
        amount: -600,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      // Should trigger 50% threshold
      expect(progress.percentUsed).toBe(60);
      expect(progress.triggeredAlerts).toContain(50);
      expect(progress.triggeredAlerts).not.toContain(75);
    });

    it('should trigger multiple thresholds at once', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 1000,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        alertThresholds: [50, 75, 90, 100],
        isOverride: true,
      });

      // Add expense that exceeds 90% threshold
      transactionService.addTransaction({
        title: 'Big expense',
        amount: -950,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      expect(progress.triggeredAlerts).toContain(50);
      expect(progress.triggeredAlerts).toContain(75);
      expect(progress.triggeredAlerts).toContain(90);
      expect(progress.triggeredAlerts).not.toContain(100);
    });
  });

  describe('Deleting transactions updates budget progress', () => {
    it('should reduce spent amount when expense is deleted', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 1000,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      const expense = transactionService.addTransaction({
        title: 'Groceries',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      }) as Transaction;

      // Verify spent
      expect(budgetService.getBudgetProgress(budget).spent).toBe(200);

      // Delete expense
      transactionService.deleteTransaction(expense.id);

      // Spent should be 0
      expect(budgetService.getBudgetProgress(budget).spent).toBe(0);
    });
  });

  describe('Period-based budget filtering', () => {
    it('should only count transactions within budget period', () => {
      const now = new Date();
      const budget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 1000,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      // Add expense for this month
      transactionService.addTransaction({
        title: 'This month',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      // Add expense for last month (should NOT be counted)
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      transactionService.addTransaction({
        title: 'Last month',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: lastMonth.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const progress = budgetService.getBudgetProgress(budget);

      // Only this month's expense should be counted
      expect(progress.spent).toBe(100);
    });
  });

  describe('Multiple budgets with same transactions', () => {
    it('should track same expense in both overall and category budgets', () => {
      const now = new Date();
      
      const overallBudget = budgetService.addBudget({
        scope: 'overall',
        targetId: '',
        amount: 1000,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      const categoryBudget = budgetService.addBudget({
        scope: 'category',
        targetId: 'Food',
        amount: 500,
        period: 'monthly',
        year: now.getFullYear(),
        periodIndex: now.getMonth() + 1,
        currency: 'USD',
        isOverride: true,
      });

      transactionService.addTransaction({
        title: 'Groceries',
        amount: -150,
        type: 'expense',
        category: 'Food',
        date: now.toISOString().split('T')[0],
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      });

      const overallProgress = budgetService.getBudgetProgress(overallBudget);
      const categoryProgress = budgetService.getBudgetProgress(categoryBudget);

      // Both budgets should reflect the same expense
      expect(overallProgress.spent).toBe(150);
      expect(categoryProgress.spent).toBe(150);

      // But percentages differ based on budget amount
      expect(overallProgress.percentUsed).toBe(15);
      expect(categoryProgress.percentUsed).toBe(30);
    });
  });
});
