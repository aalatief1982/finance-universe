import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { createStorageMock } from '@/test/storage-mock';
import { Transaction } from '@/types/transaction';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Import after mocks
import { TransactionProvider, useTransactions } from '../TransactionContext';

// Test component to access context
const TestComponent = ({ onMount }: { onMount: (ctx: ReturnType<typeof useTransactions>) => void }) => {
  const context = useTransactions();
  React.useEffect(() => {
    onMount(context);
  }, [context, onMount]);
  return <div data-testid="test">{context.transactions.length}</div>;
};

describe('TransactionContext Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('Transaction persistence', () => {
    it('should persist transactions to localStorage', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      const transaction: Transaction = {
        id: 'tx-1',
        title: 'Test Transaction',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      };

      act(() => {
        contextRef!.addTransaction(transaction);
      });

      await waitFor(() => {
        expect(screen.getByTestId('test').textContent).toBe('1');
      });

      // Verify localStorage was called
      expect(storageMock.setItem).toHaveBeenCalled();
    });

    it('should load transactions from localStorage on mount', async () => {
      // Pre-populate storage
      const existingTransactions: Transaction[] = [
        {
          id: 'tx-existing',
          title: 'Existing',
          amount: -50,
          type: 'expense',
          category: 'Food',
          date: '2024-01-15',
          fromAccount: 'Cash',
          currency: 'USD',
          source: 'manual',
        },
      ];

      storageMock.setItem('xpensia_transactions', JSON.stringify(existingTransactions));

      render(
        <TransactionProvider>
          <TestComponent onMount={() => {}} />
        </TransactionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test').textContent).toBe('1');
      });
    });

    it('should update transaction in state and storage', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      const transaction: Transaction = {
        id: 'tx-update',
        title: 'Original Title',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      };

      act(() => {
        contextRef!.addTransaction(transaction);
      });

      await waitFor(() => {
        expect(contextRef!.transactions.length).toBe(1);
      });

      act(() => {
        contextRef!.updateTransaction({
          ...transaction,
          title: 'Updated Title',
        });
      });

      await waitFor(() => {
        expect(contextRef!.transactions[0].title).toBe('Updated Title');
      });
    });

    it('should delete transaction from state and storage', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      const transaction: Transaction = {
        id: 'tx-delete',
        title: 'To Delete',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      };

      act(() => {
        contextRef!.addTransaction(transaction);
      });

      await waitFor(() => {
        expect(contextRef!.transactions.length).toBe(1);
      });

      act(() => {
        contextRef!.deleteTransaction('tx-delete');
      });

      await waitFor(() => {
        expect(contextRef!.transactions.length).toBe(0);
      });
    });
  });

  describe('Summary calculations', () => {
    it('should calculate correct income total', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      act(() => {
        contextRef!.addTransaction({
          id: 'income-1',
          title: 'Salary',
          amount: 5000,
          type: 'income',
          category: 'Salary',
          date: '2024-01-15',
          fromAccount: 'Bank',
          currency: 'USD',
          source: 'manual',
        });
      });

      await waitFor(() => {
        const summary = contextRef!.getTransactionsSummary();
        expect(summary.income).toBe(5000);
      });
    });

    it('should calculate correct expense total', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      act(() => {
        contextRef!.addTransaction({
          id: 'expense-1',
          title: 'Groceries',
          amount: -200,
          type: 'expense',
          category: 'Food',
          date: '2024-01-15',
          fromAccount: 'Cash',
          currency: 'USD',
          source: 'manual',
        });
      });

      await waitFor(() => {
        const summary = contextRef!.getTransactionsSummary();
        expect(summary.expenses).toBe(200);
      });
    });

    it('should group transactions by category', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      act(() => {
        contextRef!.addTransactions([
          {
            id: 'food-1',
            title: 'Groceries',
            amount: -100,
            type: 'expense',
            category: 'Food',
            date: '2024-01-15',
            fromAccount: 'Cash',
            currency: 'USD',
            source: 'manual',
          },
          {
            id: 'food-2',
            title: 'Restaurant',
            amount: -50,
            type: 'expense',
            category: 'Food',
            date: '2024-01-16',
            fromAccount: 'Cash',
            currency: 'USD',
            source: 'manual',
          },
          {
            id: 'transport-1',
            title: 'Uber',
            amount: -30,
            type: 'expense',
            category: 'Transport',
            date: '2024-01-17',
            fromAccount: 'Cash',
            currency: 'USD',
            source: 'manual',
          },
        ]);
      });

      await waitFor(() => {
        const byCategory = contextRef!.getTransactionsByCategory();
        expect(byCategory.length).toBe(2);

        const food = byCategory.find((c: any) => c.category === 'Food');
        expect(food?.transactions.length).toBe(2);
        expect(food?.total).toBe(-150);

        const transport = byCategory.find((c: any) => c.category === 'Transport');
        expect(transport?.transactions.length).toBe(1);
      });
    });
  });

  describe('Batch operations', () => {
    it('should add multiple transactions at once', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      const transactions: Transaction[] = [
        {
          id: 'batch-1',
          title: 'Batch 1',
          amount: -100,
          type: 'expense',
          category: 'Food',
          date: '2024-01-15',
          fromAccount: 'Cash',
          currency: 'USD',
          source: 'manual',
        },
        {
          id: 'batch-2',
          title: 'Batch 2',
          amount: -200,
          type: 'expense',
          category: 'Food',
          date: '2024-01-16',
          fromAccount: 'Cash',
          currency: 'USD',
          source: 'manual',
        },
      ];

      act(() => {
        contextRef!.addTransactions(transactions);
      });

      await waitFor(() => {
        expect(contextRef!.transactions.length).toBe(2);
      });
    });

    it('should clear all transactions', async () => {
      let contextRef: ReturnType<typeof useTransactions>;

      render(
        <TransactionProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </TransactionProvider>
      );

      act(() => {
        contextRef!.addTransaction({
          id: 'to-clear',
          title: 'Will be cleared',
          amount: -100,
          type: 'expense',
          category: 'Food',
          date: '2024-01-15',
          fromAccount: 'Cash',
          currency: 'USD',
          source: 'manual',
        });
      });

      await waitFor(() => {
        expect(contextRef!.transactions.length).toBe(1);
      });

      act(() => {
        contextRef!.clearTransactions();
      });

      await waitFor(() => {
        expect(contextRef!.transactions.length).toBe(0);
      });
    });
  });
});
