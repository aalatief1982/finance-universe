import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import { transactionService } from '../TransactionService';
import { Transaction } from '@/types/transaction';

// Mock firebase-analytics to prevent actual analytics calls
vi.mock('@/utils/firebase-analytics', () => ({
  logAnalyticsEvent: vi.fn(),
}));

describe('TransactionService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    localStorage.clear();
  });

  describe('Single Record Operations', () => {
    it('adds an expense and creates 1 record', () => {
      const expense = {
        title: 'Groceries',
        amount: -50,
        category: 'Food',
        date: '2024-01-15',
        type: 'expense' as const,
        source: 'manual' as const,
      };

      const result = transactionService.addTransaction(expense);

      // Should return a single transaction, not an array
      expect(Array.isArray(result)).toBe(false);
      expect((result as Transaction).id).toBeDefined();
      expect((result as Transaction).title).toBe('Groceries');

      const allTransactions = transactionService.getAllTransactions();
      expect(allTransactions).toHaveLength(1);
    });

    it('adds an income and creates 1 record', () => {
      const income = {
        title: 'Salary',
        amount: 5000,
        category: 'Income',
        date: '2024-01-01',
        type: 'income' as const,
        source: 'manual' as const,
      };

      const result = transactionService.addTransaction(income);

      expect(Array.isArray(result)).toBe(false);
      expect((result as Transaction).amount).toBe(5000);

      const allTransactions = transactionService.getAllTransactions();
      expect(allTransactions).toHaveLength(1);
    });
  });

  describe('Dual-Entry Transfer Operations', () => {
    it('creates exactly 2 records for a transfer', () => {
      const transfer = {
        title: 'Transfer to Savings',
        amount: 1000,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'Checking',
        toAccount: 'Savings',
      };

      const result = transactionService.addTransaction(transfer);

      // Should return an array of 2 transactions
      expect(Array.isArray(result)).toBe(true);
      expect((result as Transaction[]).length).toBe(2);

      const allTransactions = transactionService.getAllTransactions();
      expect(allTransactions).toHaveLength(2);
    });

    it('both records share the same transferId', () => {
      const transfer = {
        title: 'Transfer',
        amount: 500,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'Account A',
        toAccount: 'Account B',
      };

      const result = transactionService.addTransaction(transfer) as Transaction[];

      expect(result[0].transferId).toBeDefined();
      expect(result[0].transferId).toBe(result[1].transferId);
    });

    it('one record has transferDirection "out" with negative amount', () => {
      const transfer = {
        title: 'Transfer',
        amount: 500,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'Checking',
        toAccount: 'Savings',
      };

      const result = transactionService.addTransaction(transfer) as Transaction[];

      const outRecord = result.find(t => t.transferDirection === 'out');
      expect(outRecord).toBeDefined();
      expect(outRecord!.amount).toBe(-500);
    });

    it('one record has transferDirection "in" with positive amount', () => {
      const transfer = {
        title: 'Transfer',
        amount: 500,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'Checking',
        toAccount: 'Savings',
      };

      const result = transactionService.addTransaction(transfer) as Transaction[];

      const inRecord = result.find(t => t.transferDirection === 'in');
      expect(inRecord).toBeDefined();
      expect(inRecord!.amount).toBe(500);
    });

    it('both records have category set to "Transfer"', () => {
      const transfer = {
        title: 'Transfer',
        amount: 500,
        category: 'SomeOtherCategory', // Even if user specifies different category
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'A',
        toAccount: 'B',
      };

      const result = transactionService.addTransaction(transfer) as Transaction[];

      expect(result[0].category).toBe('Transfer');
      expect(result[1].category).toBe('Transfer');
    });

    it('both records have correct fromAccount and toAccount', () => {
      const transfer = {
        title: 'Transfer',
        amount: 200,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'Checking',
        toAccount: 'Savings',
      };

      const result = transactionService.addTransaction(transfer) as Transaction[];

      result.forEach(t => {
        expect(t.fromAccount).toBe('Checking');
        expect(t.toAccount).toBe('Savings');
      });
    });
  });

  describe('Transfer Update Operations', () => {
    it('updating one half of a transfer updates both linked records', () => {
      const transfer = {
        title: 'Original Title',
        amount: 100,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'A',
        toAccount: 'B',
      };

      const created = transactionService.addTransaction(transfer) as Transaction[];
      const outRecord = created.find(t => t.transferDirection === 'out')!;

      transactionService.updateTransaction(outRecord.id, { title: 'Updated Title' });

      const allTransactions = transactionService.getAllTransactions();
      const updatedOut = allTransactions.find(t => t.transferDirection === 'out');
      const updatedIn = allTransactions.find(t => t.transferDirection === 'in');

      expect(updatedOut!.title).toBe('Updated Title');
      expect(updatedIn!.title).toBe('Updated Title');
    });

    it('amount changes maintain correct signs in both halves', () => {
      const transfer = {
        title: 'Transfer',
        amount: 100,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'A',
        toAccount: 'B',
      };

      const created = transactionService.addTransaction(transfer) as Transaction[];
      const outRecord = created.find(t => t.transferDirection === 'out')!;

      transactionService.updateTransaction(outRecord.id, { amount: 200 });

      const allTransactions = transactionService.getAllTransactions();
      const updatedOut = allTransactions.find(t => t.transferDirection === 'out');
      const updatedIn = allTransactions.find(t => t.transferDirection === 'in');

      expect(updatedOut!.amount).toBe(-200);
      expect(updatedIn!.amount).toBe(200);
    });
  });

  describe('Transfer Delete Operations', () => {
    it('deleting one half of a transfer deletes both linked records', () => {
      const transfer = {
        title: 'Transfer',
        amount: 100,
        category: 'Transfer',
        date: '2024-01-15',
        type: 'transfer' as const,
        source: 'manual' as const,
        fromAccount: 'A',
        toAccount: 'B',
      };

      const created = transactionService.addTransaction(transfer) as Transaction[];
      const outRecord = created.find(t => t.transferDirection === 'out')!;

      expect(transactionService.getAllTransactions()).toHaveLength(2);

      const deleted = transactionService.deleteTransaction(outRecord.id);
      expect(deleted).toBe(true);

      expect(transactionService.getAllTransactions()).toHaveLength(0);
    });
  });

  describe('Regular Transaction Operations', () => {
    it('updates a regular transaction without affecting others', () => {
      const expense1 = {
        title: 'Expense 1',
        amount: -50,
        category: 'Food',
        date: '2024-01-15',
        type: 'expense' as const,
        source: 'manual' as const,
      };
      const expense2 = {
        title: 'Expense 2',
        amount: -30,
        category: 'Transport',
        date: '2024-01-16',
        type: 'expense' as const,
        source: 'manual' as const,
      };

      const created1 = transactionService.addTransaction(expense1) as Transaction;
      transactionService.addTransaction(expense2);

      transactionService.updateTransaction(created1.id, { title: 'Updated Expense' });

      const allTransactions = transactionService.getAllTransactions();
      expect(allTransactions).toHaveLength(2);

      const updated = allTransactions.find(t => t.id === created1.id);
      expect(updated!.title).toBe('Updated Expense');
    });

    it('deletes a regular transaction', () => {
      const expense = {
        title: 'Expense',
        amount: -50,
        category: 'Food',
        date: '2024-01-15',
        type: 'expense' as const,
        source: 'manual' as const,
      };

      const created = transactionService.addTransaction(expense) as Transaction;
      expect(transactionService.getAllTransactions()).toHaveLength(1);

      const deleted = transactionService.deleteTransaction(created.id);
      expect(deleted).toBe(true);
      expect(transactionService.getAllTransactions()).toHaveLength(0);
    });
  });
});
