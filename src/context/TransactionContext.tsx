
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionSummary, CategorySummary, TimePeriodData, TimePeriod, TransactionType, TransactionSource } from '@/types/transaction';
import { storeTransactions, getStoredTransactions } from '@/utils/storage-utils';

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
  processTransactionsFromSMS?: (smsMessages: any[]) => void; // Adding this method
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
    const loadedTransactions = getStoredTransactions();
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
      storeTransactions(transactions);
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
        if (transactions.length === 0) return [];
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
    storeTransactions([]);
  }, []);

  // Add a function to process SMS messages and extract transactions
  const processTransactionsFromSMS = useCallback((smsMessages: any[]) => {
    // In a real app, this would process SMS messages to extract transaction data
    // For now, we'll create a simple implementation that creates transactions from messages
    const extractedTransactions = smsMessages.map(sms => {
      // Very basic extraction logic - in a real app, this would be much more sophisticated
      const messageText = sms.message || '';
      
      // Attempt to find amount using a simple regex pattern
      const amountMatch = messageText.match(/(\$|USD|SAR|AED|EGP)\s*(\d+[.,]\d+|\d+)/i);
      let amount = 0;
      if (amountMatch) {
        // Extract the numeric part and replace comma with dot for parsing
        const amountStr = amountMatch[2].replace(',', '.');
        amount = parseFloat(amountStr);
      }
      
      // Simple logic to determine if it's an expense or income
      const isExpense = /debit|purchase|payment|paid|withdraw|spent|charged|deducted/i.test(messageText);
      const isIncome = /credit|deposit|received|salary|transferred to you|sent you/i.test(messageText);
      
      const transactionType: TransactionType = isIncome ? 'income' : (isExpense ? 'expense' : 'expense');
      
      // Simple category detection
      let category = 'Other';
      if (/food|restaurant|cafe|dining|pizza|burger|coffee/i.test(messageText)) {
        category = 'Food & Dining';
      } else if (/transport|uber|lyft|taxi|bus|train|metro|subway/i.test(messageText)) {
        category = 'Transportation';
      } else if (/shop|store|supermarket|grocery|mall|amazon|online/i.test(messageText)) {
        category = 'Shopping';
      } else if (/bill|utility|electric|water|gas|internet|phone/i.test(messageText)) {
        category = 'Bills & Utilities';
      } else if (/entertainment|movie|cinema|theatre|netflix|spotify/i.test(messageText)) {
        category = 'Entertainment';
      }
      
      // Create a transaction from the SMS message
      const transaction: Transaction = {
        id: uuidv4(),
        title: `Transaction from ${sms.sender}`,
        amount: transactionType === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        category,
        date: sms.date || new Date().toISOString().split('T')[0],
        type: transactionType,
        notes: `Extracted from SMS: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
        source: 'import',
        fromAccount: 'Main Account',
        smsDetails: {
          sender: sms.sender,
          message: messageText,
          timestamp: sms.timestamp || new Date().toISOString()
        }
      };
      
      return transaction;
    });
    
    // Add the extracted transactions to the state
    const validTransactions = extractedTransactions.filter(tx => tx.amount !== 0);
    addTransactions(validTransactions);
    
    return validTransactions.length;
  }, [addTransactions]);

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
    addTransactions,
    processTransactionsFromSMS
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
