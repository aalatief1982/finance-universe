import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';
import { useTransactionsCrud } from './transactions/useTransactionsCrud';
import { useTransactionsFilters } from './transactions/useTransactionsFilters';
import { useTransactionsSorting } from './transactions/useTransactionsSorting';
import { useTransactionsPagination } from './transactions/useTransactionsPagination';
import { useUser } from '@/context/UserContext';

export function useTransactionsState() {
  // Get user context for currency preferences
  const { user } = useUser();
  const userCurrency = user?.preferences?.currency || 'USD';
  
  // CRUD operations
  const {
    transactions,
    setTransactions,
    currentTransaction,
    setCurrentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    handleAddTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    openEditDialog
  } = useTransactionsCrud();

  // Filtering
  const {
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filtersVisible,
    setFiltersVisible,
    clearFilters,
    uniqueCategories,
    hasActiveFilters
  } = useTransactionsFilters({ transactions });

  // Sorting
  const {
    sortedTransactions,
    sortField,
    sortDirection,
    setSortDirection,
    handleSort
  } = useTransactionsSorting({ filteredTransactions });

  // Pagination
  const {
    paginatedTransactions,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages
  } = useTransactionsPagination({ sortedTransactions });

  // Transaction summary calculations
  const [transactionSummary, setTransactionSummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  });

  const [categoryBreakdown, setCategoryBreakdown] = useState<
    { name: string; value: number }[]
  >([]);

  // Calculate transaction summary and category breakdown
  useEffect(() => {
    if (transactions.length === 0) {
      setTransactionSummary({ income: 0, expenses: 0, balance: 0 });
      setCategoryBreakdown([]);
      return;
    }

    // Calculate summary
    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.amount > 0) {
          acc.income += transaction.amount;
        } else {
          acc.expenses += Math.abs(transaction.amount);
        }
        acc.balance += transaction.amount;
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 }
    );

    setTransactionSummary(summary);

    // Calculate category breakdown for expenses only
    const expensesByCategory = transactions
      .filter(t => t.amount < 0)
      .reduce((acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setCategoryBreakdown(categoryData);
  }, [transactions]);

  // Get recent transactions
  const getRecentTransactions = useCallback((limit = 5) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions]);

  // Calculate transactions by time period
  const getTransactionsByTimePeriod = useCallback((period: 'week' | 'month' | 'year' = 'month') => {
    const now = new Date();
    let startDate: Date;
    
    // Determine start date based on period
    switch(period) {
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    // Filter transactions within the period
    const periodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= now;
    });
    
    // Group by date
    const grouped = periodTransactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      let key: string;
      
      if (period === 'week') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!acc[key]) {
        acc[key] = { income: 0, expense: 0 };
      }
      
      if (tx.amount > 0) {
        acc[key].income += tx.amount;
      } else {
        acc[key].expense += Math.abs(tx.amount);
      }
      
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);
    
    // Convert to array for charting
    return Object.entries(grouped).map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense
    }));
  }, [transactions]);

  // Import transactions from SMS
  const importFromSMS = useCallback((smsTransactions: Omit<Transaction, 'id'>[]) => {
    const newTransactions = smsTransactions.map(tx => ({
      ...tx,
      id: uuidv4()
    }));
    
    setTransactions(prev => [...newTransactions, ...prev]);
  }, [setTransactions]);

  return {
    // CRUD-related
    transactions,
    currentTransaction,
    setCurrentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    handleAddTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    openEditDialog,

    // Filtering-related
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filtersVisible,
    setFiltersVisible,
    clearFilters,
    uniqueCategories,
    hasActiveFilters,

    // Sorting-related
    sortField,
    sortDirection,
    setSortDirection,
    handleSort,

    // Pagination-related
    paginatedTransactions,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    
    // Summary and analytics
    transactionSummary,
    categoryBreakdown,
    getRecentTransactions,
    getTransactionsByTimePeriod,
    
    // Import functionality
    importFromSMS,
    
    // User preferences
    userCurrency
  };
}
