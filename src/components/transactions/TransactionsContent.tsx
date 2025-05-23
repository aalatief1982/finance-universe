
import React from 'react';
import TransactionGrid from '@/components/transactions/TransactionGrid';
import TransactionTable from '@/components/TransactionTable';
import EmptyTransactionState from '@/components/transactions/EmptyTransactionState';
import PaginationInfo from '@/components/transactions/PaginationInfo';
import { Transaction } from '@/types/transaction';

interface TransactionsContentProps {
  paginatedTransactions: Transaction[];
  viewMode: 'grid' | 'table';
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  hasTransactions: boolean;
  hasActiveFilters: boolean;
  onAddTransaction: () => void;
  onClearFilters: () => void;
  filteredTransactions: Transaction[];
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (value: number) => void;
}

const TransactionsContent: React.FC<TransactionsContentProps> = ({
  paginatedTransactions,
  viewMode,
  sortField,
  sortDirection,
  onSort,
  onEditTransaction,
  onDeleteTransaction,
  hasTransactions,
  hasActiveFilters,
  onAddTransaction,
  onClearFilters,
  filteredTransactions,
  itemsPerPage,
  totalPages,
  currentPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  return (
    <>
      {paginatedTransactions.length > 0 ? (
        viewMode === 'grid' ? (
          <TransactionGrid
            transactions={paginatedTransactions}
            onEditTransaction={onEditTransaction}
            onDeleteTransaction={onDeleteTransaction}
          />
        ) : (
          <TransactionTable
            transactions={paginatedTransactions}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            onRowClick={onEditTransaction}
          />
        )
      ) : (
        <EmptyTransactionState
          hasTransactions={hasTransactions}
          hasFilters={hasActiveFilters}
          onAddTransaction={onAddTransaction}
          onClearFilters={onClearFilters}
        />
      )}
      
      {filteredTransactions.length > itemsPerPage && (
        <PaginationInfo
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredTransactions.length}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </>
  );
};

export default TransactionsContent;
