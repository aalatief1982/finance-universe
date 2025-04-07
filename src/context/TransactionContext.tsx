
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, TransactionSummary, CategorySummary, TimePeriodData } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addBatchTransactions: (transactions: Transaction[]) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  isLoading: boolean;
  // Add missing methods
  getTransactionsSummary?: () => TransactionSummary;
  getTransactionsByCategory?: () => CategorySummary[];
  getTransactionsByTimePeriod?: (period: string) => TimePeriodData[];
  processTransactionsFromSMS?: (messages: any[]) => void;
  getCategoryPath?: (categoryId: string) => string;
}

const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  addTransaction: () => {},
  addBatchTransactions: () => {},
  deleteTransaction: () => {},
  updateTransaction: () => {},
  isLoading: false,
  getTransactionsSummary: () => ({ totalIncome: 0, totalExpense: 0, netAmount: 0, count: 0, period: 'all', income: 0, expense: 0 }),
  getTransactionsByCategory: () => [],
  getTransactionsByTimePeriod: () => [],
  processTransactionsFromSMS: () => {},
  getCategoryPath: () => '',
});

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load transactions from localStorage on mount
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const storedTransactions = localStorage.getItem('transactions');
        
        if (storedTransactions) {
          const parsedTransactions = JSON.parse(storedTransactions);
          setTransactionsState(parsedTransactions);
        } else {
          // Don't use mock data, start with empty array
          setTransactionsState([]);
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
    
    setTransactionsState(prevTransactions => [...prevTransactions, newTransaction]);
  };
  
  const addBatchTransactions = (newTransactions: Transaction[]) => {
    // Make sure all transactions have IDs
    const transactionsWithIds = newTransactions.map(tx => 
      tx.id ? tx : { ...tx, id: uuidv4() }
    );
    
    setTransactionsState(prevTransactions => [...prevTransactions, ...transactionsWithIds]);
  };
  
  const deleteTransaction = (id: string) => {
    setTransactionsState(prevTransactions => 
      prevTransactions.filter(transaction => transaction.id !== id)
    );
  };
  
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactionsState(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === id ? { ...transaction, ...updates } : transaction
      )
    );
  };

  // Add the getTransactionsSummary method
  const getTransactionsSummary = (): TransactionSummary => {
    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.amount > 0) {
          acc.income += transaction.amount;
        } else {
          acc.expense += Math.abs(transaction.amount);
        }
        acc.netAmount += transaction.amount;
        acc.count += 1;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, netAmount: 0, count: 0, period: 'all', income: 0, expense: 0 }
    );
    
    summary.totalIncome = summary.income;
    summary.totalExpense = summary.expense;
    
    return summary;
  };

  // Add the getTransactionsByCategory method
  const getTransactionsByCategory = (): CategorySummary[] => {
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    const totalExpense = transactions.reduce((sum, tx) => sum + (tx.amount < 0 ? Math.abs(tx.amount) : 0), 0);
    
    // Calculate amount and count per category
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only consider expenses
        if (!categoryTotals[tx.category]) {
          categoryTotals[tx.category] = { amount: 0, count: 0 };
        }
        categoryTotals[tx.category].amount += Math.abs(tx.amount);
        categoryTotals[tx.category].count += 1;
      }
    });
    
    // Convert to CategorySummary array
    return Object.entries(categoryTotals).map(([categoryId, data]) => ({
      categoryId,
      categoryName: categoryId, // Ideally get real name from category data
      amount: data.amount,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      count: data.count,
      name: categoryId, // For charts compatibility
      value: data.amount // For charts compatibility
    }));
  };

  // Add the getTransactionsByTimePeriod method
  const getTransactionsByTimePeriod = (period: string = 'month'): TimePeriodData[] => {
    // Group transactions by date period
    const groupedByDate: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      let dateKey: string;
      
      // Format date key based on the period
      if (period === 'day') {
        dateKey = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'week') {
        // Get start of week
        const dayOfWeek = txDate.getDay();
        const startOfWeek = new Date(txDate);
        startOfWeek.setDate(txDate.getDate() - dayOfWeek);
        dateKey = startOfWeek.toISOString().split('T')[0];
      } else if (period === 'month') {
        dateKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'year') {
        dateKey = String(txDate.getFullYear());
      } else {
        dateKey = txDate.toISOString().split('T')[0];
      }
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { income: 0, expense: 0 };
      }
      
      if (tx.amount > 0) {
        groupedByDate[dateKey].income += tx.amount;
      } else {
        groupedByDate[dateKey].expense += Math.abs(tx.amount);
      }
    });
    
    // Convert to TimePeriodData array
    return Object.entries(groupedByDate).map(([date, data]) => ({
      period: date,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
      date
    }));
  };

  // Add the processTransactionsFromSMS method
  const processTransactionsFromSMS = (messages: any[]) => {
    // Simple implementation that converts SMS messages to transactions
    const newTransactions = messages.map(msg => {
      // Extract transaction details from SMS message
      // This is a simplified implementation - real SMS parsing would be more complex
      const isExpense = msg.message.toLowerCase().includes('debit') || 
                         msg.message.toLowerCase().includes('purchase') ||
                         msg.message.toLowerCase().includes('payment');
      
      // Try to extract amount using regex
      const amountMatch = msg.message.match(/(\d+[.,]\d+|\d+)/);
      const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 0;
      
      return {
        id: uuidv4(),
        title: `SMS: ${msg.sender}`,
        amount: isExpense ? -amount : amount,
        category: isExpense ? 'Uncategorized Expense' : 'Uncategorized Income',
        date: new Date(msg.date).toISOString(),
        type: isExpense ? 'expense' as const : 'income' as const,
        source: 'sms' as const,
        smsDetails: {
          sender: msg.sender,
          message: msg.message,
          timestamp: new Date(msg.date).toISOString()
        }
      };
    });
    
    // Add the transactions to the store
    addBatchTransactions(newTransactions);
    
    return newTransactions;
  };

  // Add the getCategoryPath method
  const getCategoryPath = (categoryId: string): string => {
    // Simple implementation that just returns the category ID
    // In a real app, this would look up the category hierarchy
    return categoryId;
  };
  
  return (
    <TransactionContext.Provider 
      value={{ 
        transactions, 
        addTransaction, 
        addBatchTransactions,
        deleteTransaction, 
        updateTransaction,
        isLoading,
        getTransactionsSummary,
        getTransactionsByCategory,
        getTransactionsByTimePeriod,
        processTransactionsFromSMS,
        getCategoryPath
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
