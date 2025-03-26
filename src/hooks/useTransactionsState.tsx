
import { useTransactionsCrud } from './transactions/useTransactionsCrud';
import { useTransactionsFilters } from './transactions/useTransactionsFilters';
import { useTransactionsSorting } from './transactions/useTransactionsSorting';
import { useTransactionsPagination } from './transactions/useTransactionsPagination';

export function useTransactionsState() {
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
    totalPages
  };
}
