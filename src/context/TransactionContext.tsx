
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '@/types/transaction';

interface TransactionContextType {
  transactions: Transaction[];
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  clearTransactions: () => void;
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
    // Ensure all transactions have required fields
    const validTransactions = newTransactions.map(transaction => ({
      ...transaction,
      id: transaction.id || `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: transaction.source || 'manual'
    }));
    
    setTransactions(prevTransactions => [...prevTransactions, ...validTransactions]);
  };

  const addTransaction = (transaction: Transaction) => {
    // Ensure transaction has required fields
    const validTransaction = {
      ...transaction,
      id: transaction.id || `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: transaction.source || 'manual'
    };
    
    setTransactions(prevTransactions => [...prevTransactions, validTransaction]);
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
    const categorized: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(transaction);
    });
    
    return Object.entries(categorized).map(([category, transactions]) => ({
      category,
      transactions,
      total: transactions.reduce((sum, t) => sum + Number(t.amount), 0)
    }));
  };

  const getTransactionsByTimePeriod = (period = 'month') => {
    // Time period grouping logic would go here
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
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= now;
    });
  };

  const processTransactionsFromSMS = (messages: any[]): Transaction[] => {
    // SMS processing logic would go here
    // This is a mock implementation
    return messages.map(msg => ({
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: msg.body?.substring(0, 30) || 'SMS Transaction',
      amount: -Math.abs(Math.random() * 100),
      type: 'expense',
      category: 'Uncategorized',
      date: new Date().toISOString().split('T')[0],
      fromAccount: 'Bank Account',
      currency: 'USD',
      description: msg.body || '',
      source: 'sms'
    }));
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      clearTransactions,
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
