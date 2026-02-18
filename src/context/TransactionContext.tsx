/**
 * @file TransactionContext.tsx
 * @description React context for transaction state, storage synchronization,
 *              and computed summaries used across the application.
 *
 * @responsibilities
 * - Load and persist transactions to local storage (demo or real namespace)
 * - Provide CRUD helpers for transaction state
 * - Expose summary/grouping utilities for UI consumption
 * - Manage demo ↔ real mode switching
 *
 * @dependencies
 * - storage-utils.ts: real transaction persistence and StorageEvent dispatch
 * - demo-storage.ts: demo namespace read/write
 * - app-mode.ts: mode flag management
 */
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { getStoredTransactions, storeTransactions } from '@/utils/storage-utils';
import { ensureFxFields } from '@/services/FxConversionService';
import { appMode, AppMode } from '@/utils/app-mode';
import { demoStorage, DEMO_STORAGE_KEY } from '@/utils/demo-storage';

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
  appMode: AppMode;
  exitDemoMode: () => void;
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

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

/**
 * Load transactions from the correct namespace for the current mode.
 */
function loadTransactionsForMode(mode: AppMode): Transaction[] {
  return mode === 'demo' ? demoStorage.getTransactions() : getStoredTransactions();
}

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<AppMode>(appMode.get());
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactionsForMode(appMode.get())
  );

  // ============================================================================
  // SECTION: Storage Sync
  // PURPOSE: React to storage events from the same or other tabs/windows
  // ============================================================================

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'xpensia_transactions' && currentMode === 'real') {
        setTransactions(getStoredTransactions());
      }
      if (event.key === DEMO_STORAGE_KEY && currentMode === 'demo') {
        setTransactions(demoStorage.getTransactions());
      }
      if (event.key === 'xpensia_app_mode') {
        const newMode = (event.newValue === 'real' ? 'real' : 'demo') as AppMode;
        setCurrentMode(newMode);
        setTransactions(loadTransactionsForMode(newMode));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentMode]);

  // ============================================================================
  // SECTION: Mode Management
  // ============================================================================

  const exitDemoMode = useCallback(() => {
    appMode.activateReal();
    setCurrentMode('real');
    setTransactions(getStoredTransactions());
  }, []);

  /**
   * Switch to real mode on first user write. Called internally before writes.
   */
  const ensureRealMode = useCallback((): boolean => {
    if (currentMode === 'demo') {
      appMode.activateReal();
      setCurrentMode('real');
      return true; // switched
    }
    return false;
  }, [currentMode]);

  // ============================================================================
  // SECTION: CRUD Helpers
  // ============================================================================

  const addTransactions = useCallback((newTransactions: Transaction[]) => {
    const switched = ensureRealMode();

    const validTransactions = newTransactions.map(t =>
      ensureFxFields({
        ...t,
        id: t.id || `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: t.source || 'manual',
      })
    );

    setTransactions(prev => {
      // After switching modes, prev still holds demo transactions — start fresh
      const base = switched ? getStoredTransactions() : prev;
      const updated = [...validTransactions, ...base];
      storeTransactions(updated);
      return updated;
    });
  }, [ensureRealMode]);

  const addTransaction = useCallback((transaction: Transaction) => {
    const switched = ensureRealMode();

    const validTransaction = ensureFxFields({
      ...transaction,
      id: transaction.id || `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: transaction.source || 'manual',
    });

    setTransactions(prev => {
      const base = switched ? getStoredTransactions() : prev;
      const updated = [validTransaction, ...base];
      storeTransactions(updated);
      return updated;
    });
  }, [ensureRealMode]);

  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    // Updates only make sense in real mode; if somehow called in demo mode, switch silently
    ensureRealMode();

    setTransactions(prev => {
      const next = ensureFxFields(updatedTransaction);
      const updated = prev.map(t => t.id === next.id ? next : t);
      storeTransactions(updated);
      return updated;
    });
  }, [ensureRealMode]);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== transactionId);
      if (currentMode === 'real') {
        storeTransactions(filtered);
      } else {
        demoStorage.setTransactions(filtered);
      }
      return filtered;
    });
  }, [currentMode]);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
    if (currentMode === 'real') {
      storeTransactions([]);
    } else {
      demoStorage.clear();
    }
  }, [currentMode]);

  // ============================================================================
  // SECTION: Summary + Grouping Helpers
  // ============================================================================

  const getTransactionsSummary = (): TransactionSummary => ({
    income: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
    expenses: Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)),
    balance: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
  });

  const getTransactionsByCategory = (): CategorySummary[] => {
    const categorized: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const cat = t.category || 'Uncategorized';
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(t);
    });
    return Object.entries(categorized).map(([category, txns]) => {
      const total = txns.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      return { name: category, category, transactions: txns, total, value: total };
    });
  };

  const getTransactionsByTimePeriod = (period = 'month'): TimePeriodData[] => {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week': startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
      case 'year': startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate = new Date(now); startDate.setMonth(now.getMonth() - 1);
    }
    const periodTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startDate && d <= now;
    });
    const grouped: Record<string, { income: number; expense: number }> = {};
    periodTx.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      if (t.type === 'income') grouped[key].income += Math.abs(Number(t.amount));
      else grouped[key].expense += Math.abs(Number(t.amount));
    });
    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
  };

  const processTransactionsFromSMS = (messages: SmsMessageInput[]): Transaction[] =>
    messages.map(msg => ({
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: msg.body?.substring(0, 30) || 'SMS Transaction',
      amount: -Math.abs(Math.random() * 100),
      type: 'expense',
      category: 'Uncategorized',
      date: new Date().toISOString().split('T')[0],
      fromAccount: 'Bank Account',
      currency: 'USD',
      source: 'sms',
    }));

  return (
    <TransactionContext.Provider value={{
      transactions,
      appMode: currentMode,
      exitDemoMode,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      clearTransactions,
      getTransactionsSummary,
      getTransactionsByCategory,
      getTransactionsByTimePeriod,
      processTransactionsFromSMS,
      addTransaction,
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const useOptionalTransactions = () => useContext(TransactionContext);
