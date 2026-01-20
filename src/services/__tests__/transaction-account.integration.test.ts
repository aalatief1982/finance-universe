import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import { Transaction } from '@/types/transaction';
import { Account } from '@/models/account';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Mock firebase analytics
vi.mock('@/utils/firebase-analytics', () => ({
  logAnalyticsEvent: vi.fn(),
}));

// Import after mocks
import { transactionService } from '../TransactionService';
import { accountService } from '../AccountService';

describe('Transaction + Account Integration', () => {
  const testAccount: Account = {
    id: 'acc-1',
    name: 'Bank Account',
    type: 'Bank',
    currency: 'USD',
    initialBalance: 1000,
    startDate: '2024-01-01',
    tags: [],
  };

  const savingsAccount: Account = {
    id: 'acc-2',
    name: 'Savings',
    type: 'Bank',
    currency: 'USD',
    initialBalance: 5000,
    startDate: '2024-01-01',
    tags: [],
  };

  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();

    // Set up accounts
    accountService.addAccount(testAccount);
    accountService.addAccount(savingsAccount);
  });

  describe('Income transactions affect account balance', () => {
    it('should increase account balance when income is added', () => {
      transactionService.addTransaction({
        title: 'Salary',
        amount: 2000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        toAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      const balance = accountService.getAccountBalance('acc-1');
      // Initial 1000 + Income 2000 = 3000
      expect(balance).toBe(3000);
    });

    it('should handle multiple income transactions', () => {
      transactionService.addTransaction({
        title: 'Salary',
        amount: 2000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        toAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      transactionService.addTransaction({
        title: 'Bonus',
        amount: 500,
        type: 'income',
        category: 'Salary',
        date: '2024-01-20',
        toAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      const balance = accountService.getAccountBalance('acc-1');
      // Initial 1000 + 2000 + 500 = 3500
      expect(balance).toBe(3500);
    });
  });

  describe('Expense transactions affect account balance', () => {
    it('should decrease account balance when expense is added', () => {
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      const balance = accountService.getAccountBalance('acc-1');
      // Initial 1000 - Expense 200 = 800
      expect(balance).toBe(800);
    });

    it('should handle multiple expense transactions', () => {
      transactionService.addTransaction({
        title: 'Groceries',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      transactionService.addTransaction({
        title: 'Rent',
        amount: -500,
        type: 'expense',
        category: 'Housing',
        date: '2024-01-20',
        fromAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      const balance = accountService.getAccountBalance('acc-1');
      // Initial 1000 - 200 - 500 = 300
      expect(balance).toBe(300);
    });
  });

  describe('Dual-entry transfers affect both accounts correctly', () => {
    it('should decrease source account and increase destination account', () => {
      transactionService.addTransaction({
        title: 'Transfer to Savings',
        amount: 300,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      const bankBalance = accountService.getAccountBalance('acc-1');
      const savingsBalance = accountService.getAccountBalance('acc-2');

      // Bank: Initial 1000 - Transfer 300 = 700
      expect(bankBalance).toBe(700);
      // Savings: Initial 5000 + Transfer 300 = 5300
      expect(savingsBalance).toBe(5300);
    });

    it('should handle multiple transfers correctly', () => {
      transactionService.addTransaction({
        title: 'Transfer 1',
        amount: 300,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      transactionService.addTransaction({
        title: 'Transfer 2',
        amount: 200,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-16',
        fromAccount: 'Savings',
        toAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      const bankBalance = accountService.getAccountBalance('acc-1');
      const savingsBalance = accountService.getAccountBalance('acc-2');

      // Bank: 1000 - 300 + 200 = 900
      expect(bankBalance).toBe(900);
      // Savings: 5000 + 300 - 200 = 5100
      expect(savingsBalance).toBe(5100);
    });

    it('should create exactly 2 records for each transfer', () => {
      const result = transactionService.addTransaction({
        title: 'Transfer',
        amount: 500,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      }) as Transaction[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      const outEntry = result.find(t => t.transferDirection === 'out');
      const inEntry = result.find(t => t.transferDirection === 'in');

      expect(outEntry).toBeDefined();
      expect(inEntry).toBeDefined();
      expect(outEntry?.transferId).toBe(inEntry?.transferId);
      expect(outEntry?.amount).toBe(-500);
      expect(inEntry?.amount).toBe(500);
    });
  });

  describe('Deleting transactions reverts account balance', () => {
    it('should revert balance when expense is deleted', () => {
      const expense = transactionService.addTransaction({
        title: 'Groceries',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      }) as Transaction;

      // Balance should be 800
      expect(accountService.getAccountBalance('acc-1')).toBe(800);

      // Delete the expense
      transactionService.deleteTransaction(expense.id);

      // Balance should be back to 1000
      expect(accountService.getAccountBalance('acc-1')).toBe(1000);
    });

    it('should revert both account balances when transfer is deleted', () => {
      const transfer = transactionService.addTransaction({
        title: 'Transfer',
        amount: 300,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      }) as Transaction[];

      // Verify balances after transfer
      expect(accountService.getAccountBalance('acc-1')).toBe(700);
      expect(accountService.getAccountBalance('acc-2')).toBe(5300);

      // Delete one half of transfer (should delete both)
      transactionService.deleteTransaction(transfer[0].id);

      // Both balances should revert
      expect(accountService.getAccountBalance('acc-1')).toBe(1000);
      expect(accountService.getAccountBalance('acc-2')).toBe(5000);
    });
  });

  describe('Updating transactions updates account balance', () => {
    it('should update balance when transaction amount is changed', () => {
      const expense = transactionService.addTransaction({
        title: 'Groceries',
        amount: -200,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      }) as Transaction;

      // Balance should be 800
      expect(accountService.getAccountBalance('acc-1')).toBe(800);

      // Update expense amount
      transactionService.updateTransaction(expense.id, { amount: -300 });

      // Balance should be 700 (1000 - 300)
      expect(accountService.getAccountBalance('acc-1')).toBe(700);
    });

    it('should update both balances when transfer amount is changed', () => {
      const transfer = transactionService.addTransaction({
        title: 'Transfer',
        amount: 300,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      }) as Transaction[];

      // Update transfer amount via one of the entries
      transactionService.updateTransaction(transfer[0].id, { amount: 500 });

      // Both accounts should reflect new amount
      expect(accountService.getAccountBalance('acc-1')).toBe(500); // 1000 - 500
      expect(accountService.getAccountBalance('acc-2')).toBe(5500); // 5000 + 500
    });
  });

  describe('Account deletion protection', () => {
    it('should not allow deleting account with linked transactions', () => {
      transactionService.addTransaction({
        title: 'Expense',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      const result = accountService.deleteAccount('acc-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('linked');
    });

    it('should allow deleting account with no linked transactions', () => {
      const newAccount: Account = {
        id: 'acc-empty',
        name: 'Empty Account',
        type: 'Cash',
        currency: 'USD',
        initialBalance: 0,
        startDate: '2024-01-01',
        tags: [],
      };

      accountService.addAccount(newAccount);
      const result = accountService.deleteAccount('acc-empty');

      expect(result.success).toBe(true);
    });

    it('should count linked transactions correctly', () => {
      transactionService.addTransaction({
        title: 'Expense',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Bank Account',
        currency: 'USD',
        source: 'manual',
      });

      transactionService.addTransaction({
        title: 'Transfer',
        amount: 200,
        type: 'transfer',
        category: 'Transfer',
        date: '2024-01-16',
        fromAccount: 'Bank Account',
        toAccount: 'Savings',
        currency: 'USD',
        source: 'manual',
      });

      // Bank Account should have 3 linked transactions (1 expense + 2 transfer entries)
      const count = accountService.getLinkedTransactionCount('acc-1');
      expect(count).toBe(3);
    });
  });
});
