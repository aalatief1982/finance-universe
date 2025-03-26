
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';

interface UseTransactionsSortingProps {
  filteredTransactions: Transaction[];
}

export function useTransactionsSorting({ filteredTransactions }: UseTransactionsSortingProps) {
  const [sortedTransactions, setSortedTransactions] = useState<Transaction[]>([]);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Sort transactions
    const sorted = [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      
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
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setSortedTransactions(sorted);
  }, [filteredTransactions, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new field
    }
  };

  return {
    sortedTransactions,
    sortField,
    sortDirection,
    setSortDirection,
    handleSort
  };
}
