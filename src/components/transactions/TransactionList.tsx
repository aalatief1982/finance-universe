import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '@/types/transaction';
import TransactionCard from '@/components/transactions/TransactionCard';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionSortControls from '@/components/transactions/TransactionSortControls';
import TransactionTable from '@/components/TransactionTable';
import PaginationInfo from '@/components/transactions/PaginationInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Grid2X2, Table } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/components/ui/use-toast';

// Import hooks
import { useTransactionsFilters } from '@/hooks/transactions/useTransactionsFilters';
import { useTransactionsSorting } from '@/hooks/transactions/useTransactionsSorting';
import { useTransactionsPagination } from '@/hooks/transactions/useTransactionsPagination';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onAdd
}) => {
  const { toast } = useToast();
  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Use the filtering hook
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

  // Use the sorting hook
  const {
    sortedTransactions,
    sortField,
    sortDirection,
    setSortDirection,
    handleSort
  } = useTransactionsSorting({ filteredTransactions });

  // Use the pagination hook
  const {
    paginatedTransactions,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages
  } = useTransactionsPagination({ sortedTransactions });

  // Calculate summary
  const summary = filteredTransactions.reduce(
    (acc, t) => {
      if (t.amount > 0) {
        acc.income += t.amount;
      } else {
        acc.expenses += Math.abs(t.amount);
      }
      acc.balance += t.amount;
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );

  const handleDeleteTransaction = (id: string) => {
    onDelete(id);
    toast({
      title: "Transaction deleted",
      description: "The transaction has been successfully deleted.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Transactions</h2>
        <Button onClick={onAdd} size="sm">
          <Plus size={16} className="mr-1" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionFilters
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
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.income)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.expenses)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid2X2 size={16} className="mr-2" />
            Grid View
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table size={16} className="mr-2" />
            Table View
          </Button>
        </div>
        {viewMode === 'table' && (
          <TransactionSortControls
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSortDirectionChange={setSortDirection}
          />
        )}
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'Transaction' : 'Transactions'}
            {hasActiveFilters && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (filtered from {transactions.length})
              </span>
            )}
          </h3>
          
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {paginatedTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No transactions found matching your filters.</p>
            {transactions.length > 0 && hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'grid' ? (
              paginatedTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <TransactionCard
                    transaction={transaction}
                    onEdit={() => onEdit(transaction)}
                    onDelete={() => handleDeleteTransaction(transaction.id)}
                    showActions={true}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  />
                </motion.div>
              ))
            ) : (
              <TransactionTable
                transactions={paginatedTransactions}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onRowClick={onEdit}
              />
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > itemsPerPage && (
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredTransactions.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
    </div>
  );
};

export default TransactionList;
