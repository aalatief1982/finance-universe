
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionSortControlsProps {
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}

const TransactionSortControls: React.FC<TransactionSortControlsProps> = ({
  sortField,
  sortDirection,
  onSort,
  onSortDirectionChange
}) => {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Sort by:</span>
        <Select
          value={sortField || "date"}
          onValueChange={(value) => onSort(value)}
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="title">Description</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
      >
        {sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4 me-1" />
        ) : (
          <ChevronDown className="h-4 w-4 me-1" />
        )}
        {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      </Button>
    </div>
  );
};

export default TransactionSortControls;
