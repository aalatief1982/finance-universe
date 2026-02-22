/**
 * @file TransactionContext.tsx
 * @description React context for transaction state, storage synchronization,
 *              and computed summaries used across the application.
 *
 * @responsibilities
 * - Load and persist transactions to local storage
 * - Provide CRUD helpers for transaction state
 * - Expose summary/grouping utilities for UI consumption
 *
 * @dependencies
 * - storage-utils.ts: local storage persistence and StorageEvent dispatch
 *
 * @review-tags
 * - @side-effects: writes to storage and listens for storage events
 * - @performance: summary calculations iterate over full transaction lists
 *
 * @review-checklist
 * - [ ] StorageEvent handler stays in sync with storage keys
 * - [ ] Summary calculations exclude transfers where required
 */
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { Transaction } from '@/types/transaction';
import {
  getStoredTransactions,
  storeTransactions,
} from '@/utils/storage-utils';
import { ensureFxFields } from '@/services/FxConversionService';
import {
  TransactionValidationError,
  validateTransaction,
} from '@/lib/transaction-validation';

interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
}

interface CategorySummary {
  name: string;
  category: string;
  transactions: Transaction[];
  total: number;
  value: number;
}

interface TimePeriodData {
  date: string;
  income: number;
  expense: number;
}

interface SmsMessageInput {
  sender?: string;
  body?: string;
  date?: Date;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  clearTransactions: () => void;
  getTransactionsSummary: () => TransactionSummary;
  getTransactionsByCategory: () => CategorySummary[];
  getTransactionsByTimePeriod: (period?: string) => TimePeriodData[];
  processTransactionsFromSMS: (messages: SmsMessageInput[]) => Transaction[];
  addTransaction: (transaction: Transaction) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined,
);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ============================================================================
  // SECTION: Storage Initialization + Sync
  // PURPOSE: Load transactions and listen for external storage updates
  // REVIEW: Ensure storage key matches storage-utils constants
  // ============================================================================

  // Load transactions from local storage on component mount
  useEffect(() => {
    const storedTransactions = getStoredTransactions();
    setTransactions(storedTransactions);
  }, []);

  // Listen for storage changes from other tabs or manual dispatch
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'xpensia_transactions') {
        setTransactions(getStoredTransactions());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // ============================================================================
  // SECTION: CRUD Helpers
  // PURPOSE: Maintain local state and persist updates
  // REVIEW: Ensure ID and source defaults are applied consistently
  // ============================================================================

  const addTransactions = (newTransactions: Transaction[]) => {
    // Ensure all transactions have required fields
    const validTransactions = newTransactions.map((transaction) => {
      const errors = validateTransaction(transaction, transaction.type);
      if (Object.keys(errors).length > 0) {
        throw new TransactionValidationError(errors);
      }

      return ensureFxFields({
        ...transaction,
        id:
          transaction.id ||
          `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: transaction.source || 'manual',
      });
    });

    // Update state
    setTransactions((prevTransactions) => {
      const updatedTransactions = [...validTransactions, ...prevTransactions];

      // Store in local storage
      storeTransactions(updatedTransactions);

      return updatedTransactions;
    });
  };

  const addTransaction = (transaction: Transaction) => {
    const errors = validateTransaction(transaction, transaction.type);
    if (Object.keys(errors).length > 0) {
      throw new TransactionValidationError(errors);
    }

    // Ensure transaction has required fields
    const validTransaction = ensureFxFields({
      ...transaction,
      id:
        transaction.id ||
        `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: transaction.source || 'manual',
    });

    // Update state
    setTransactions((prevTransactions) => {
      const updatedTransactions = [validTransaction, ...prevTransactions];

      // Store in local storage
      storeTransactions(updatedTransactions);

      return updatedTransactions;
    });
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    const errors = validateTransaction(
      updatedTransaction,
      updatedTransaction.type,
    );
    if (Object.keys(errors).length > 0) {
      throw new TransactionValidationError(errors);
    }

    setTransactions((prevTransactions) => {
      const nextTransaction = ensureFxFields(updatedTransaction);
      const updatedTransactions = prevTransactions.map((transaction) =>
        transaction.id === nextTransaction.id ? nextTransaction : transaction,
      );

      // Store in local storage
      storeTransactions(updatedTransactions);

      return updatedTransactions;
    });
  };

  const deleteTransaction = (transactionId: string) => {
    setTransactions((prevTransactions) => {
      const filteredTransactions = prevTransactions.filter(
        (transaction) => transaction.id !== transactionId,
      );

      // Store in local storage
      storeTransactions(filteredTransactions);

      return filteredTransactions;
    });
  };

  const clearTransactions = () => {
    setTransactions([]);

    // Clear from local storage
    storeTransactions([]);
  };

  // Mock methods for wireframes
  // ============================================================================
  // SECTION: Summary + Grouping Helpers
  // PURPOSE: Provide basic aggregates for UI display
  // REVIEW: Expense totals should use absolute amounts
  // ============================================================================

  const getTransactionsSummary = () => {
    return {
      income: transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      expenses: Math.abs(
        transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0),
      ),
      balance: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    };
  };

  const getTransactionsByCategory = (): CategorySummary[] => {
    // Group by category logic would go here
    const categorized: Record<string, Transaction[]> = {};

    transactions.forEach((transaction) => {
      const category = transaction.category || 'Uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(transaction);
    });

    return Object.entries(categorized).map(([category, txns]) => {
      const total = txns.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0,
      );
      return {
        name: category,
        category,
        transactions: txns,
        total,
        value: total,
      };
    });
  };

  const getTransactionsByTimePeriod = (period = 'month'): TimePeriodData[] => {
    // Time period grouping logic
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    // Filter transactions in the period
    const periodTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= now;
    });

    // Group by date and calculate income/expense
    const groupedByDate: Record<string, { income: number; expense: number }> =
      {};

    periodTransactions.forEach((t) => {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        groupedByDate[dateKey].income += Math.abs(Number(t.amount));
      } else {
        groupedByDate[dateKey].expense += Math.abs(Number(t.amount));
      }
    });

    return Object.entries(groupedByDate).map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
    }));
  };

  const processTransactionsFromSMS = (
    messages: SmsMessageInput[],
  ): Transaction[] => {
    // SMS processing logic would go here
    // This is a mock implementation
    return messages.map((msg) => ({
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: msg.body?.substring(0, 30) || 'SMS Transaction',
      amount: -Math.abs(Math.random() * 100),
      type: 'expense',
      category: 'Uncategorized',
      date: new Date().toISOString().split('T')[0],
      fromAccount: 'Bank Account',
      currency: 'USD',
      description: msg.body || '',
      source: 'sms',
    }));
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransactions,
        updateTransaction,
        deleteTransaction,
        clearTransactions,
        getTransactionsSummary,
        getTransactionsByCategory,
        getTransactionsByTimePeriod,
        processTransactionsFromSMS,
        addTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error(
      'useTransactions must be used within a TransactionProvider',
    );
  }
  return context;
};

export const useOptionalTransactions = () => {
  return useContext(TransactionContext);
};
