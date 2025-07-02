
import React from 'react';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import ViewToggle from '@/components/transactions/ViewToggle';
import TransactionSortControls from '@/components/transactions/TransactionSortControls';

interface TransactionsControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  clearFilters: () => void;
  uniqueCategories: string[];
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}

const TransactionsControls: React.FC<TransactionsControlsProps> = ({
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
  clearFilters,
  uniqueCategories,
  filtersVisible,
  setFiltersVisible,
  viewMode,
  setViewMode,
  sortField,
  sortDirection,
  onSort,
  onSortDirectionChange
}) => {
  return (
    <>
      <div className="flex items-center justify-between">
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
        
        <ViewToggle 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
        />
      </div>
      
      {viewMode === 'table' && (
        <TransactionSortControls
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          onSortDirectionChange={onSortDirectionChange}
        />
      )}
    </>
  );
};

export default TransactionsControls;
