
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '@/types/transaction';

interface TransactionContextType {
  transactions: Transaction[];
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  clearTransactions: () => void;
  // Add these mock methods to fix TypeScript errors in wireframes
  getTransactionsSummary: () => any;
  getTransactionsByCategory: () => any;
  getTransactionsByTimePeriod: (period?: string) => any;
  processTransactionsFromSMS: (messages: any[]) => Transaction[];
  addTransaction: (transaction: Transaction) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prevTransactions => [...prevTransactions, ...newTransactions]);
  };

  const addTransaction = (transaction: Transaction) => {
    addTransactions([transaction]);
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      )
    );
  };

  const deleteTransaction = (transactionId: string) => {
    setTransactions(prevTransactions => 
      prevTransactions.filter(transaction => transaction.id !== transactionId)
    );
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  // Mock methods for wireframes
  const getTransactionsSummary = () => {
    return {
      income: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
      expenses: Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)),
      balance: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    };
  };

  const getTransactionsByCategory = () => {
    // Group by category logic would go here
    return [];
  };

  const getTransactionsByTimePeriod = (period = 'month') => {
    // Time period grouping logic would go here
    return [];
  };

  const processTransactionsFromSMS = (messages: any[]): Transaction[] => {
    // SMS processing logic would go here
    return [];
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      clearTransactions,
      // Add mock methods
      getTransactionsSummary,
      getTransactionsByCategory,
      getTransactionsByTimePeriod,
      processTransactionsFromSMS,
      addTransaction
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
