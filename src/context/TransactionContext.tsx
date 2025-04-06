
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { transactionService } from '@/services/TransactionService';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';
import { validateData, transactionSchema, validateNewTransaction } from '@/lib/validation';
import { handleError, handleValidationError } from '@/utils/error-utils';
import { ErrorType } from '@/types/error';
import { SupportedCurrency } from '@/types/locale';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Transaction | null;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => Transaction | null;
  deleteTransaction: (id: string) => boolean;
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
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to load your transactions. Please try again.',
        originalError: error
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save transactions when they change
  useEffect(() => {
    if (!isLoading) {
      try {
        transactionService.saveTransactions(transactions);
      } catch (error) {
        handleError({
          type: ErrorType.STORAGE,
          message: 'Failed to save transactions',
          originalError: error,
          isSilent: true // Don't show toast for background save failures
        });
      }
    }
  }, [transactions, isLoading]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    try {
      // Use our new validation function
      const validationResult = validateNewTransaction(transaction);
      
      if (!validationResult.success) {
        handleValidationError(validationResult.error);
        return null;
      }
      
      // Type assertion to ensure currency is properly typed
      const typedTransaction = {
        ...transaction,
        currency: transaction.currency as string | undefined,
        person: transaction.person === 'none' ? null : transaction.person
      };
      
      const newTransaction = transactionService.addTransaction(typedTransaction);
      setTransactions(prev => [newTransaction, ...prev]);
      
      toast({
        title: 'Transaction Added',
        description: 'Your transaction has been added successfully.',
      });
      
      return newTransaction;
    } catch (error) {
      handleError({
        type: ErrorType.TRANSACTION,
        message: 'Failed to add transaction. Please try again.',
        originalError: error
      });
      
      return null;
    }
  };

  // Fix updateTransaction method to handle required fields
  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    try {
      // Find the existing transaction
      const existingTransaction = transactions.find(t => t.id === id);
      
      if (!existingTransaction) {
        throw new Error(`Transaction with id ${id} not found`);
      }
      
      // Ensure fromAccount is included
      const typedUpdates = {
        ...updates,
        currency: updates.currency as string | undefined,
        fromAccount: updates.fromAccount || existingTransaction.fromAccount || "Cash" // Provide a default
      };
      
      // Create the merged transaction for validation
      const mergedTransaction = {
        ...existingTransaction,
        ...typedUpdates
      };
      
      // Validate the merged transaction
      const validationResult = validateData(
        transactionSchema,
        mergedTransaction
      );
      
      if (!validationResult.success) {
        handleValidationError(validationResult.error);
        return null;
      }
      
      const updatedTransaction = transactionService.updateTransaction(id, typedUpdates);
      
      if (updatedTransaction) {
        setTransactions(prev => 
          prev.map(t => t.id === id ? updatedTransaction : t)
        );
        
        toast({
          title: 'Transaction Updated',
          description: 'Your transaction has been updated successfully.',
        });
        
        return updatedTransaction;
      }
      
      return null;
    } catch (error) {
      handleError({
        type: ErrorType.TRANSACTION,
        message: 'Failed to update transaction. Please try again.',
        originalError: error
      });
      
      return null;
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
        
        return true;
      }
      
      return false;
    } catch (error) {
      handleError({
        type: ErrorType.TRANSACTION,
        message: 'Failed to delete transaction. Please try again.',
        originalError: error
      });
      
      return false;
    }
  };

  const processTransactionsFromSMS = (messages: { sender: string; message: string; date: Date }[]) => {
    try {
      // Validate SMS messages
      const validMessages = messages.filter(msg => {
        if (!msg.sender || !msg.message || !msg.date) {
          console.warn('Invalid SMS message format', msg);
          return false;
        }
        return true;
      });
      
      if (validMessages.length === 0) {
        throw new Error('No valid SMS messages provided');
      }
      
      const extractedTransactions = transactionService.processTransactionsFromSMS(validMessages);
      
      // Validate each extracted transaction
      const validTransactions: Transaction[] = [];
      
      for (const transaction of extractedTransactions) {
        // Ensure currency is properly typed
        const typedTransaction = {
          ...transaction,
          currency: transaction.currency as SupportedCurrency | undefined
        };
        
        const validationResult = validateData(transactionSchema, typedTransaction);
        
        if (validationResult.success) {
          validTransactions.push(validationResult.data);
        } else {
          console.warn('Invalid transaction extracted from SMS:', validationResult.error);
        }
      }
      
      if (validTransactions.length > 0) {
        setTransactions(prev => [...validTransactions, ...prev]);
        
        toast({
          title: 'Transactions Imported',
          description: `${validTransactions.length} transactions were imported from SMS.`,
        });
      } else {
        toast({
          title: 'No Transactions Found',
          description: 'No valid transactions were found in the provided SMS messages.',
        });
      }
      
      return validTransactions;
    } catch (error) {
      handleError({
        type: ErrorType.PARSING,
        message: 'Failed to process SMS messages. Please try again.',
        originalError: error
      });
      
      return [];
    }
  };

  const getTransactionsSummary = () => {
    try {
      return transactionService.getTransactionsSummary();
    } catch (error) {
      handleError({
        type: ErrorType.TRANSACTION,
        message: 'Failed to calculate transaction summary',
        originalError: error,
        isSilent: true
      });
      
      return { income: 0, expenses: 0, balance: 0 };
    }
  };

  const getTransactionsByCategory = () => {
    try {
      return transactionService.getTransactionsByCategory();
    } catch (error) {
      handleError({
        type: ErrorType.TRANSACTION,
        message: 'Failed to calculate transactions by category',
        originalError: error,
        isSilent: true
      });
      
      return [];
    }
  };

  const getTransactionsByTimePeriod = (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      return transactionService.getTransactionsByTimePeriod(period);
    } catch (error) {
      handleError({
        type: ErrorType.TRANSACTION,
        message: 'Failed to calculate transactions by time period',
        originalError: error,
        isSilent: true
      });
      
      return [];
    }
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
