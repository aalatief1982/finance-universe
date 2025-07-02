
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';

interface UseTransactionsSortingProps {
  filteredTransactions: Transaction[];
  initialSortField?: string;
  initialSortDirection?: 'asc' | 'desc';
}

export function useTransactionsSorting({ 
  filteredTransactions,
  initialSortField = 'date',
  initialSortDirection = 'desc'
}: UseTransactionsSortingProps) {
  const [sortedTransactions, setSortedTransactions] = useState<Transaction[]>([]);
  const [sortField, setSortField] = useState<string>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  // Apply sorting whenever transactions, sort field or direction changes
  useEffect(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      
      // Handle different field types
      switch(sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setSortedTransactions(sorted);
  }, [filteredTransactions, sortField, sortDirection]);

  // Handle sort field change
  const handleSort = (field: string) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return {
    sortedTransactions,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    handleSort
  };
}
