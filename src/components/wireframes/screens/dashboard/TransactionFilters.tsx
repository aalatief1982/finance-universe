
import React from 'react';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  return (
    <div className="flex justify-between mb-2">
      <div className="space-x-1 flex">
        {['all', 'income', 'expenses'].map(tab => (
          <button 
            key={tab}
            className={`px-3 py-1 text-sm rounded-md ${
              activeTab === tab 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-1">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="text-sm px-2 py-1 dark:bg-white dark:text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
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
