
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { CATEGORIES } from '@/lib/mock-data';

// Import components
import TransactionHeader from '@/components/transactions/TransactionHeader';
import TransactionsControls from '@/components/transactions/TransactionsControls';
import TransactionsContent from '@/components/transactions/TransactionsContent';
import EditTransactionDialog from '@/components/transactions/EditTransactionDialog';
import MobileActions from '@/components/transactions/MobileActions';

// Import hook
import { useTransactionsState } from '@/hooks/useTransactionsState';

const Transactions = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const {
    transactions,
    filteredTransactions,
    paginatedTransactions,
    currentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    sortField,
    sortDirection,
    setSortDirection, // Added this missing import
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
    handleSort,
    handleAddTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    openEditDialog,
    clearFilters,
    uniqueCategories,
    hasActiveFilters,
    totalPages,
    setCurrentTransaction // Added this missing import
  } = useTransactionsState();

  return (
    <>
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <TransactionHeader 
            isAddingExpense={isAddingExpense}
            setIsAddingExpense={setIsAddingExpense}
            onAddTransaction={handleAddTransaction}
            categories={CATEGORIES}
            filtersVisible={filtersVisible}
            setFiltersVisible={setFiltersVisible}
          />
          
          <TransactionsControls 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            clearFilters={clearFilters}
            uniqueCategories={uniqueCategories}
            filtersVisible={filtersVisible}
            setFiltersVisible={setFiltersVisible}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSortDirectionChange={(direction) => setSortDirection(direction)}
          />
          
          <TransactionsContent 
            paginatedTransactions={paginatedTransactions}
            viewMode={viewMode}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEditTransaction={openEditDialog}
            onDeleteTransaction={handleDeleteTransaction}
            hasTransactions={transactions.length > 0}
            hasActiveFilters={hasActiveFilters}
            onAddTransaction={() => setIsAddingExpense(true)}
            onClearFilters={clearFilters}
            filteredTransactions={filteredTransactions}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </motion.div>
      </Layout>

      <EditTransactionDialog
        isOpen={isEditingExpense}
        onOpenChange={setIsEditingExpense}
        currentTransaction={currentTransaction}
        onSubmit={handleEditTransaction}
        onCancel={() => {
          setIsEditingExpense(false);
          setCurrentTransaction(null);
        }}
        categories={CATEGORIES}
      />
      
      <MobileActions
        onAddTransaction={() => setIsAddingExpense(true)}
        onToggleFilters={() => setFiltersVisible(!filtersVisible)}
        filtersVisible={filtersVisible}
      />
    </>
  );
};

export default Transactions;
