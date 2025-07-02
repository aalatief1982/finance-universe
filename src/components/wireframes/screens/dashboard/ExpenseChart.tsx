
import React, { useState } from 'react';
import { BarChart, PieChart, LineChart, RefreshCcw } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';

const ExpenseChart = () => {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const { transactions } = useTransactions();
  
  const hasTransactions = transactions && transactions.length > 0;

  const renderChartPlaceholder = () => {
    switch(chartType) {
      case 'pie':
        return <PieChart className="mx-auto text-gray-400 mb-2" size={24} />;
      case 'line':
        return <LineChart className="mx-auto text-gray-400 mb-2" size={24} />;
      default:
        return <BarChart className="mx-auto text-gray-400 mb-2" size={24} />;
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Expense Overview</h3>
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1 bg-white rounded-md border">
            <button 
              className={`p-1 rounded-md ${chartType === 'bar' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
              onClick={() => setChartType('bar')}
            >
              <BarChart size={16} />
            </button>
            <button 
              className={`p-1 rounded-md ${chartType === 'pie' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
              onClick={() => setChartType('pie')}
            >
              <PieChart size={16} />
            </button>
            <button 
              className={`p-1 rounded-md ${chartType === 'line' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
              onClick={() => setChartType('line')}
            >
              <LineChart size={16} />
            </button>
          </div>
          <button className="p-1 rounded-md hover:bg-gray-200" title="Refresh">
            <RefreshCcw size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="h-32 flex items-center justify-center">
        {hasTransactions ? (
          <div className="text-center">
            {renderChartPlaceholder()}
            <span className="text-xs text-gray-500">
              {chartType === 'bar' && "Expense distribution by category"}
              {chartType === 'pie' && "Spending breakdown"}
              {chartType === 'line' && "Spending trend over time"}
            </span>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500">No transaction data to display</p>
            <p className="text-xs text-gray-400 mt-1">Add transactions to see charts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseChart;
