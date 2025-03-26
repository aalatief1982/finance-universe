
import React from 'react';
import { BarChart } from 'lucide-react';

const ExpenseChart = () => {
  return (
    <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center mb-4">
      <div className="text-center">
        <BarChart className="mx-auto text-gray-400 mb-2" size={24} />
        <span className="text-sm text-gray-500">Expense Chart</span>
      </div>
    </div>
  );
};

export default ExpenseChart;
