
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';

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
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t('sort.sortBy')}:</span>
        <Select
          value={sortField || "date"}
          onValueChange={(value) => onSort(value)}
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder={t('sort.selectField')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t('sort.date')}</SelectItem>
            <SelectItem value="title">{t('sort.description')}</SelectItem>
            <SelectItem value="category">{t('sort.category')}</SelectItem>
            <SelectItem value="amount">{t('sort.amount')}</SelectItem>
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
          <ChevronUp className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
        )}
        {sortDirection === 'asc' ? t('sort.ascending') : t('sort.descending')}
      </Button>
    </div>
  );
};

export default TransactionSortControls;
