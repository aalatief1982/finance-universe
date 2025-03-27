
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { CATEGORIES } from '@/lib/mock-data';

// Import components
import TransactionHeader from '@/components/transactions/TransactionHeader';
import TransactionList from '@/components/transactions/TransactionList';
import EditTransactionDialog from '@/components/transactions/EditTransactionDialog';
import MobileActions from '@/components/transactions/MobileActions';

// Import hook
import { useTransactionsState } from '@/hooks/useTransactionsState';

const Transactions = () => {
  const {
    transactions,
    currentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    handleAddTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    openEditDialog,
    setCurrentTransaction,
    // Add sorting properties
    sortField,
    sortDirection,
    setSortDirection,
    handleSort
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
          />
          
          <TransactionList
            transactions={transactions}
            onEdit={openEditDialog}
            onDelete={handleDeleteTransaction}
            onAdd={() => setIsAddingExpense(true)}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSortDirectionChange={setSortDirection}
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
        onToggleFilters={() => {}}
        filtersVisible={false}
      />
    </>
  );
};

export default Transactions;
