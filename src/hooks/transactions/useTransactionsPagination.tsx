
import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/transaction';

interface UseTransactionsPaginationProps {
  sortedTransactions: Transaction[];
}

export function useTransactionsPagination({ sortedTransactions }: UseTransactionsPaginationProps) {
  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  // Update paginated transactions whenever dependencies change
  useEffect(() => {
    try {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPaginatedTransactions(sortedTransactions.slice(startIndex, endIndex));
    } catch (error) {
      console.error('Error updating paginated transactions:', error);
      setPaginatedTransactions([]);
    }
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Reset to first page when sorted transactions change significantly
  useEffect(() => {
    if (currentPage > 1 && sortedTransactions.length > 0 && 
        Math.ceil(sortedTransactions.length / itemsPerPage) < currentPage) {
      setCurrentPage(1);
    }
  }, [sortedTransactions.length, itemsPerPage, currentPage]);

  return {
    paginatedTransactions,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages
  };
}
