
import React from 'react';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';

interface TransactionFiltersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  period: string;
  setPeriod: (period: string) => void;
}

const TransactionFilters = ({ 
  activeTab, 
  setActiveTab, 
  period, 
  setPeriod 
}: TransactionFiltersProps) => {
  const { t } = useLanguage();
  
  const tabs = [
    { value: 'all', label: t('transactions.all') },
    { value: 'income', label: t('filter.income') },
    { value: 'expenses', label: t('filter.expense') }
  ];
  
  return (
    <div className="flex justify-between mb-2">
      <div className="space-x-1 flex">
        {tabs.map(tab => (
          <button 
            key={tab.value}
            className={`px-3 py-1 text-sm rounded-md ${
              activeTab === tab.value
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100'
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-1">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="text-sm px-2 py-1 dark:bg-white dark:text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('range.week')}</SelectItem>
            <SelectItem value="month">{t('range.month')}</SelectItem>
            <SelectItem value="year">{t('range.year')}</SelectItem>
          </SelectContent>
        </Select>
        <button className="p-1 rounded-md bg-gray-100">
          <Filter size={16} />
        </button>
      </div>
    </div>
  );
};

export default TransactionFilters;
