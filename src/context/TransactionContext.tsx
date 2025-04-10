
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionSummary, CategorySummary, TimePeriodData, TimePeriod, TransactionType, TransactionSource } from '@/types/transaction';
import { saveTransactions, getTransactions } from '@/utils/storage-utils';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsSummary: () => TransactionSummary;
  getTransactionsByCategory: () => CategorySummary[];
  getTransactionsByTimePeriod: (period: TimePeriod) => TimePeriodData[];
  clearAllTransactions: () => void;
  addTransactions: (transactions: Transaction[]) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load transactions from storage when component mounts
    const loadedTransactions = getTransactions();
    if (loadedTransactions && loadedTransactions.length > 0) {
      // Make sure all transactions have required fields
      const validTransactions = loadedTransactions.filter(
        (tx: any) => tx && typeof tx === 'object' && tx.id && tx.amount !== undefined
      );
      setTransactions(validTransactions);
    }
  }, []);

  // Save transactions to storage whenever they change
  useEffect(() => {
    if (transactions.length > 0) {
      saveTransactions(transactions);
    }
  }, [transactions]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: uuidv4(),
      date: transaction.date || new Date().toISOString().split('T')[0],
    } as Transaction;

    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const addTransactions = useCallback((newTransactions: Transaction[]) => {
    setTransactions(prev => [...newTransactions, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, transaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, ...transaction } : tx
    ));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const getTransactionById = useCallback((id: string) => {
    return transactions.find(tx => tx.id === id);
  }, [transactions]);

  const getTransactionsSummary = useCallback((): TransactionSummary => {
    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const expenses = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [transactions]);

  const getTransactionsByCategory = useCallback((): CategorySummary[] => {
    const expensesByCategory: Record<string, number> = {};
    
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const category = tx.category;
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(tx.amount);
      });
    
    // Convert to array and sort by value
    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const getTransactionsByTimePeriod = useCallback((period: TimePeriod): TimePeriodData[] => {
    const now = new Date();
    let startDate = new Date();
    
    // Set the start date based on the period
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        // Find the earliest transaction date
        const dates = transactions.map(tx => new Date(tx.date));
        startDate = new Date(Math.min(...dates.map(date => date.getTime())));
        break;
    }

    // For simplicity, let's aggregate by month
    const monthData: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate >= startDate) {
        const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthData[monthKey]) {
          monthData[monthKey] = { income: 0, expense: 0 };
        }
        
        if (tx.type === 'income') {
          monthData[monthKey].income += Math.abs(tx.amount);
        } else if (tx.type === 'expense') {
          monthData[monthKey].expense += Math.abs(tx.amount);
        }
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(monthData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const clearAllTransactions = useCallback(() => {
    setTransactions([]);
    saveTransactions([]);
  }, []);

  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionsSummary,
    getTransactionsByCategory,
    getTransactionsByTimePeriod,
    clearAllTransactions,
    addTransactions
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
