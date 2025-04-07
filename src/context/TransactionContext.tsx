
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { mockTransactions } from '@/lib/mock-data';
import { v4 as uuidv4 } from 'uuid';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addBatchTransactions: (transactions: Transaction[]) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  isLoading: boolean;
}

const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  addTransaction: () => {},
  addBatchTransactions: () => {},
  deleteTransaction: () => {},
  updateTransaction: () => {},
  isLoading: false,
});

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load transactions from localStorage on mount
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const storedTransactions = localStorage.getItem('transactions');
        
        if (storedTransactions) {
          const parsedTransactions = JSON.parse(storedTransactions);
          
          // Ensure dates are Date objects
          const formattedTransactions = parsedTransactions.map((tx: any) => ({
            ...tx,
            date: new Date(tx.date)
          }));
          
          setTransactions(formattedTransactions);
        } else {
          // Don't use mock data, start with empty array
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, []);
  
  // Save transactions to localStorage when they change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions]);
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
    };
    
    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
  };
  
  const addBatchTransactions = (newTransactions: Transaction[]) => {
    // Make sure all transactions have IDs
    const transactionsWithIds = newTransactions.map(tx => 
      tx.id ? tx : { ...tx, id: uuidv4() }
    );
    
    setTransactions(prevTransactions => [...prevTransactions, ...transactionsWithIds]);
  };
  
  const deleteTransaction = (id: string) => {
    setTransactions(prevTransactions => 
      prevTransactions.filter(transaction => transaction.id !== id)
    );
  };
  
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === id ? { ...transaction, ...updates } : transaction
      )
    );
  };
  
  return (
    <TransactionContext.Provider 
      value={{ 
        transactions, 
        addTransaction, 
        addBatchTransactions,
        deleteTransaction, 
        updateTransaction,
        isLoading
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
