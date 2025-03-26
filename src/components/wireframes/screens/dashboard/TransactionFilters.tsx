
import React from 'react';
import { Filter } from 'lucide-react';

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
        <select 
          className="text-sm border rounded-md px-2 py-1"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <button className="p-1 rounded-md bg-gray-100">
          <Filter size={16} />
        </button>
      </div>
    </div>
  );
};

export default TransactionFilters;
