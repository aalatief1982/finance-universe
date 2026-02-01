/**
 * @file useTransactionsState.tsx
 * @description Aggregates transaction CRUD, filtering, sorting, pagination,
 *              and summary calculations for the Transactions UI.
 *
 * @responsibilities
 * - Bridge TransactionContext with UI-specific CRUD handlers
 * - Compose filtering, sorting, and pagination hooks
 * - Calculate summaries and category breakdowns for dashboards
 *
 * @dependencies
 * - useTransactionsCrud/useTransactionsFilters/useTransactionsSorting
 * - TransactionContext for global transaction state
 * - storage-utils.ts for category lookup and change history
 *
 * @review-tags
 * - @side-effects: persists changes and records category history
 * - @performance: summary calculations run on full transaction list
 *
 * @review-checklist
 * - [ ] Summary calculations exclude transfers where required
 * - [ ] Category change history records only real changes
 */
import { useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { useTransactionsCrud } from './transactions/useTransactionsCrud';
import { useTransactionsFilters } from './transactions/useTransactionsFilters';
import { useTransactionsSorting } from './transactions/useTransactionsSorting';
import { useTransactionsPagination } from './transactions/useTransactionsPagination';
import { useUser } from '@/context/UserContext';
import {
  removeTransaction,
  getStoredCategories,
  getStoredCategoryRules,
  addCategoryChange,
  getCategoryHierarchy
} from '@/utils/storage-utils';
import { useTransactions } from '@/context/TransactionContext';

export function useTransactionsState() {
  // Get user context for currency preferences
  const { user } = useUser();
  const userCurrency = user?.preferences?.currency || 'USD';
  
  // Transactions from global context
  const {
    transactions,
    addTransaction: contextAddTransaction,
    updateTransaction: contextUpdateTransaction,
    deleteTransaction: contextDeleteTransaction
  } = useTransactions();
  
  // ============================================================================
  // SECTION: CRUD Wiring
  // PURPOSE: Wrap CRUD hooks with context-backed persistence
  // REVIEW: Ensure updates stay in sync with storage events
  // ============================================================================

  // CRUD operations with enhanced storage
  const {
    currentTransaction,
    setCurrentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    handleAddTransaction: baseCrudAddTransaction,
    handleEditTransaction: baseCrudEditTransaction,
    handleDeleteTransaction: baseCrudDeleteTransaction,
    openEditDialog
  } = useTransactionsCrud();

  // Override CRUD methods to use enhanced storage
  const handleAddTransaction = useCallback((formData: any) => {
    const transactionType: "income" | "expense" = formData.amount >= 0 ? "income" : "expense";
    
    const newTransaction: Transaction = {
      id: uuidv4(),
      title: formData.title,
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      type: transactionType,
      notes: formData.notes,
      source: 'manual',
      fromAccount: formData.fromAccount || 'Cash', // Add default fromAccount
      toAccount: formData.toAccount,
      description: formData.description,
      person: formData.person,
      currency: formData.currency || userCurrency
    };

    // Persist and update global state
    contextAddTransaction(newTransaction);
    setIsAddingExpense(false);

    return newTransaction;
  }, [contextAddTransaction, setIsAddingExpense, userCurrency]);

  const handleEditTransaction = useCallback((formData: any) => {
    if (!currentTransaction) return null;

    const transactionType: "income" | "expense" = formData.amount >= 0 ? "income" : "expense";

    const updatedTransaction: Transaction = {
      ...currentTransaction,
      title: formData.title,
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      type: transactionType,
      notes: formData.notes,
      fromAccount: formData.fromAccount || currentTransaction.fromAccount || 'Cash',
      toAccount: formData.toAccount,
      description: formData.description,
      person: formData.person,
      currency: formData.currency
    };

    // Record category change if different from original
    if (updatedTransaction.category !== currentTransaction.category) {
      addCategoryChange({
        transactionId: currentTransaction.id,
        oldCategoryId: currentTransaction.category,
        newCategoryId: updatedTransaction.category,
        timestamp: new Date().toISOString()
      });
    }

    // Persist update
    contextUpdateTransaction(updatedTransaction);

    setIsEditingExpense(false);
    setCurrentTransaction(null);

    return updatedTransaction;
  }, [currentTransaction, contextUpdateTransaction, setIsEditingExpense, setCurrentTransaction]);

  const handleDeleteTransaction = useCallback((id: string) => {
    removeTransaction(id);
    contextDeleteTransaction(id);
  }, [contextDeleteTransaction]);

  // ============================================================================
  // SECTION: Filters + Sorting + Pagination
  // PURPOSE: Compose UI-facing derived transaction lists
  // REVIEW: Filtering and sorting should be applied in deterministic order
  // ============================================================================

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

  // ============================================================================
  // SECTION: Summary Calculations
  // PURPOSE: Compute totals and category breakdowns for dashboards
  // REVIEW: Transfers should be excluded from income/expense totals
  // ============================================================================

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

    // Calculate summary (EXCLUDES transfers)
    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += Math.abs(transaction.amount);
        } else if (transaction.type === 'expense') {
          acc.expenses += Math.abs(transaction.amount);
        }
        // Transfers don't affect balance calculation
        if (transaction.type !== 'transfer') {
          acc.balance += transaction.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 }
    );

    setTransactionSummary(summary);

    // Get category hierarchy for proper names
    const categoryMap = new Map();
    const categories = getStoredCategories();
    
    categories.forEach(category => {
      categoryMap.set(category.id, category.name);
    });

    // Calculate category breakdown for expenses only (EXCLUDES transfers)
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const categoryId = transaction.category;
        const categoryName = categoryMap.get(categoryId) || categoryId;
        
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += Math.abs(transaction.amount);
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

  // Calculate transactions by time period with enhanced category handling
  const getTransactionsByTimePeriod = useCallback((period: 'week' | 'month' | 'year' = 'month') => {
    const now = new Date();
    let startDate: Date;
    
    // Determine start date based on period
    switch(period) {
      case 'week': {
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        break;
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      }
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
      
      // Skip transfers from time period calculations
      if (tx.type === 'transfer') return acc;
      
      if (tx.type === 'income') {
        acc[key].income += Math.abs(tx.amount);
      } else if (tx.type === 'expense') {
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

  // Import transactions from SMS with enhanced storage
  const importFromSMS = useCallback((smsTransactions: Omit<Transaction, 'id'>[]) => {
    const newTransactions = smsTransactions.map(tx => ({
      ...tx,
      id: uuidv4()
    }));
    
    // Apply category rules to auto-categorize transactions
    const categoryRules = getStoredCategoryRules();
    
    const categorizedTransactions = newTransactions.map(transaction => {
      // Default to uncategorized if no match is found
      let matchedCategory = transaction.category || 'Uncategorized';
      
      // Try to match title against category rules
      if (transaction.title) {
        // Sort rules by priority (highest first)
        const sortedRules = [...categoryRules].sort((a, b) => b.priority - a.priority);
        
        for (const rule of sortedRules) {
          const { pattern, isRegex, categoryId } = rule;
          
          let isMatch = false;
          if (isRegex) {
            try {
              const regex = new RegExp(pattern, 'i');
              isMatch = regex.test(transaction.title);
            } catch (error) {
              if (import.meta.env.MODE === 'development') {
                console.error('Invalid regex pattern:', pattern, error);
              }
            }
          } else {
            isMatch = transaction.title.toLowerCase().includes(pattern.toLowerCase());
          }
          
          if (isMatch) {
            matchedCategory = categoryId;
            break;
          }
        }
      }
      
      return {
        ...transaction,
        category: matchedCategory
      };
    });
    
    // Persist and update global state
    categorizedTransactions.forEach(transaction => {
      contextAddTransaction(transaction);
    });

    return categorizedTransactions;
  }, [contextAddTransaction]);

  // Get category path for a transaction
  const getCategoryPath = useCallback((categoryId: string): string => {
    if (!categoryId) return "";
    
    const categoryHierarchy = getCategoryHierarchy();
    const path: string[] = [];
    
    const findCategory = (categories: any[], targetId: string): boolean => {
      for (const category of categories) {
        if (category.id === targetId) {
          path.unshift(category.name);
          return true;
        }
        
        if (category.subcategories && category.subcategories.length > 0) {
          if (findCategory(category.subcategories, targetId)) {
            path.unshift(category.name);
            return true;
          }
        }
      }
      
      return false;
    };
    
    findCategory(categoryHierarchy, categoryId);
    
    return path.join(' > ');
  }, []);

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
    
    // Category utilities
    getCategoryPath,
    
    // Import functionality
    importFromSMS,
    
    // User preferences
    userCurrency
  };
}
