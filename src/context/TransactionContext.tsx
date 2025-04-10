
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '@/types/transaction';

interface TransactionContextType {
  transactions: Transaction[];
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  clearTransactions: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prevTransactions => [...prevTransactions, ...newTransactions]);
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

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      clearTransactions
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
