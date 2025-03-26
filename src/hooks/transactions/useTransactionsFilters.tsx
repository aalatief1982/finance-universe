
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';

interface UseTransactionsFiltersProps {
  transactions: Transaction[];
}

export function useTransactionsFilters({ transactions }: UseTransactionsFiltersProps) {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Get unique categories from transactions
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Check if any filters are active
  const hasActiveFilters = Boolean(searchQuery || selectedCategory || selectedType || startDate || endDate);

  useEffect(() => {
    // Filter transactions based on all criteria
    let filtered = [...transactions];

    // Text search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Type filter
    if (selectedType) {
      const isExpense = selectedType === 'expense';
      filtered = filtered.filter(t => isExpense ? t.amount < 0 : t.amount > 0);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    
    if (endDate) {
      // Add one day to include the end date fully
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      filtered = filtered.filter(t => new Date(t.date) < endDatePlusOne);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, selectedCategory, selectedType, startDate, endDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
    setStartDate(null);
    setEndDate(null);
  };

  return {
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
  };
}
