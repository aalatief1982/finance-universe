
import React, { useState, useEffect } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { useTransactions } from '@/context/TransactionContext';
import { Calendar, PieChart, BarChart, Download } from 'lucide-react';

interface ReportsScreenProps {
  onExportReport?: () => void;
}

const ReportsScreen = ({ onExportReport }: ReportsScreenProps) => {
  const [activeTab, setActiveTab] = useState<'category' | 'timeline'>('category');
  const [period, setPeriod] = useState('month');
  const { getTransactionsByCategory, getTransactionsByTimePeriod } = useTransactions();
  
  const categoryData = getTransactionsByCategory();
  const timelineData = getTransactionsByTimePeriod(period as any);
  
  // Colors for the chart
  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#d946ef'];
  
  // Calculate total expenses for percentage
  const totalExpenses = categoryData.reduce((sum, category) => sum + category.value, 0);
  
  // Calculate total income and expenses for timeline
  const totalTimelineIncome = timelineData.reduce((sum, data) => sum + data.income, 0);
  const totalTimelineExpenses = timelineData.reduce((sum, data) => sum + data.expense, 0);
  
  return (
    <WireframeContainer>
      <WireframeHeader title="Reports" />
      
      <div className="space-y-4">
        <div className="flex justify-between mb-2">
          <div className="space-x-1 flex">
            <button 
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                activeTab === 'category' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100'
              }`}
              onClick={() => setActiveTab('category')}
            >
              <PieChart size={14} className="mr-1" />
              <span>By Category</span>
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                activeTab === 'timeline' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              <BarChart size={14} className="mr-1" />
              <span>Timeline</span>
            </button>
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
          </div>
        </div>
        
        {activeTab === 'category' ? (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-center font-medium mb-1">Expenses by Category</h3>
              {categoryData.length > 0 ? (
                <>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32 mt-2">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                        
                        {categoryData.map((category, index) => {
                          const percentage = totalExpenses ? (category.value / totalExpenses) * 100 : 0;
                          const strokeDasharray = `${percentage * 2.51} 251`;
                          const strokeDashoffset = index === 0 ? 0 : 
                            `-${categoryData.slice(0, index).reduce((sum, c) => sum + (c.value / totalExpenses) * 251, 0)}`;
                          
                          return (
                            <circle 
                              key={category.name}
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="none" 
                              stroke={chartColors[index % chartColors.length]} 
                              strokeWidth="20" 
                              strokeDasharray={strokeDasharray} 
                              strokeDashoffset={strokeDashoffset} 
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categoryData.map((category, index) => (
                      <div key={category.name} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-1"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="text-xs">{category.name}: ${category.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No expense data available</p>
                </div>
              )}
            </div>
            
            <div className="border rounded-lg divide-y">
              <h3 className="p-3 font-medium">Top Spending Categories</h3>
              {categoryData.length > 0 ? (
                categoryData
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)
                  .map((category, index) => (
                    <div key={category.name} className="p-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white"
                          style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'][index] }}
                        >
                          {index + 1}
                        </div>
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium">${category.value.toFixed(2)}</span>
                    </div>
                  ))
              ) : (
                <div className="p-3 text-center">
                  <p className="text-gray-500">No categories to display</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-center font-medium mb-1">Income vs Expenses</h3>
              {timelineData.length > 0 ? (
                <>
                  <div className="h-40 mt-2 flex items-end space-x-1 justify-between px-2">
                    {timelineData.map(data => (
                      <div key={data.date} className="flex flex-col items-center flex-1">
                        <div className="flex flex-col w-full space-y-1">
                          <div 
                            className="bg-green-500 w-full rounded-t"
                            style={{ height: `${data.income > 0 ? (data.income / Math.max(...timelineData.map(d => Math.max(d.income, d.expense)))) * 100 : 0}px` }}
                          />
                          <div 
                            className="bg-red-500 w-full rounded-t"
                            style={{ height: `${data.expense > 0 ? (data.expense / Math.max(...timelineData.map(d => Math.max(d.income, d.expense)))) * 100 : 0}px` }}
                          />
                        </div>
                        <span className="text-xs mt-1">{data.date}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4 mt-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
                      <span className="text-xs">Income</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-1" />
                      <span className="text-xs">Expenses</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No timeline data available</p>
                </div>
              )}
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Income:</span>
                  <span className="text-sm font-medium text-green-600">
                    ${totalTimelineIncome.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Expenses:</span>
                  <span className="text-sm font-medium text-red-600">
                    ${totalTimelineExpenses.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-sm font-medium">Net Savings:</span>
                  <span className="text-sm font-medium">
                    ${(totalTimelineIncome - totalTimelineExpenses).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <WireframeButton variant="secondary" onClick={onExportReport}>
          <div className="flex items-center justify-center">
            <Download size={18} className="mr-1" />
            <span>Export Report</span>
          </div>
        </WireframeButton>
      </div>
    </WireframeContainer>
  );
};

export default ReportsScreen;
