
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { transactionService } from '@/services/TransactionService';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  processTransactionsFromSMS: (messages: { sender: string; message: string; date: Date }[]) => Transaction[];
  getTransactionsSummary: () => { income: number; expenses: number; balance: number };
  getTransactionsByCategory: () => { name: string; value: number }[];
  getTransactionsByTimePeriod: (period?: 'week' | 'month' | 'year') => { date: string; income: number; expense: number }[];
  isLoading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load transactions on mount
  useEffect(() => {
    try {
      const loadedTransactions = transactionService.getAllTransactions();
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save transactions when they change
  useEffect(() => {
    if (!isLoading) {
      try {
        transactionService.saveTransactions(transactions);
      } catch (error) {
        console.error('Failed to save transactions:', error);
      }
    }
  }, [transactions, isLoading]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = transactionService.addTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      toast({
        title: 'Transaction Added',
        description: 'Your transaction has been added successfully.',
      });
      return newTransaction;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    try {
      const updatedTransaction = transactionService.updateTransaction(id, updates);
      if (updatedTransaction) {
        setTransactions(prev => 
          prev.map(t => t.id === id ? updatedTransaction : t)
        );
        toast({
          title: 'Transaction Updated',
          description: 'Your transaction has been updated successfully.',
        });
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteTransaction = (id: string) => {
    try {
      const success = transactionService.deleteTransaction(id);
      if (success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast({
          title: 'Transaction Deleted',
          description: 'Your transaction has been deleted successfully.',
        });
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const processTransactionsFromSMS = (messages: { sender: string; message: string; date: Date }[]) => {
    try {
      const extractedTransactions = transactionService.processTransactionsFromSMS(messages);
      if (extractedTransactions.length > 0) {
        setTransactions(prev => [...extractedTransactions, ...prev]);
        toast({
          title: 'Transactions Imported',
          description: `${extractedTransactions.length} transactions were imported from SMS.`,
        });
      } else {
        toast({
          title: 'No Transactions Found',
          description: 'No transactions were found in the provided SMS messages.',
        });
      }
      return extractedTransactions;
    } catch (error) {
      console.error('Failed to process SMS transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to process SMS messages. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  };

  const getTransactionsSummary = () => {
    return transactionService.getTransactionsSummary();
  };

  const getTransactionsByCategory = () => {
    return transactionService.getTransactionsByCategory();
  };

  const getTransactionsByTimePeriod = (period: 'week' | 'month' | 'year' = 'month') => {
    return transactionService.getTransactionsByTimePeriod(period);
  };

  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    processTransactionsFromSMS,
    getTransactionsSummary,
    getTransactionsByCategory,
    getTransactionsByTimePeriod,
    isLoading,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
