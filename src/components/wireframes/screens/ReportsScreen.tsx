
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Calendar, PieChart, BarChart } from 'lucide-react';

interface ReportsScreenProps {}

// Mock category data
const mockCategoryData = [
  { name: 'Food', value: 450 },
  { name: 'Transportation', value: 200 },
  { name: 'Housing', value: 800 },
  { name: 'Entertainment', value: 150 },
  { name: 'Shopping', value: 300 },
  { name: 'Utilities', value: 180 },
  { name: 'Other', value: 120 },
];

// Mock timeline data
const mockTimelineData = [
  { date: 'Jan', income: 2500, expense: 1800 },
  { date: 'Feb', income: 2300, expense: 1900 },
  { date: 'Mar', income: 2600, expense: 2100 },
  { date: 'Apr', income: 2400, expense: 1700 },
  { date: 'May', income: 2800, expense: 2000 },
  { date: 'Jun', income: 2700, expense: 1950 },
];

const ReportsScreen = () => {
  const [activeTab, setActiveTab] = useState<'category' | 'timeline'>('category');
  const [period, setPeriod] = useState('month');
  
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
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
        
        {activeTab === 'category' ? (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-center font-medium mb-1">Expenses by Category</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32 mt-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                    
                    {/* This is a simplified representation of a pie chart */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="50 251" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="75 251" strokeDashoffset="-50" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="40 251" strokeDashoffset="-125" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray="30 251" strokeDashoffset="-165" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20" strokeDasharray="20 251" strokeDashoffset="-195" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" strokeWidth="20" strokeDasharray="15 251" strokeDashoffset="-215" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#d946ef" strokeWidth="20" strokeDasharray="21 251" strokeDashoffset="-230" />
                  </svg>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                {mockCategoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#d946ef'][index % 7] }}
                    />
                    <span className="text-xs">{category.name}: ${category.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border rounded-lg divide-y">
              <h3 className="p-3 font-medium">Top Spending Categories</h3>
              {mockCategoryData
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
                    <span className="font-medium">${category.value}</span>
                  </div>
                ))
              }
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-center font-medium mb-1">Income vs Expenses</h3>
              <div className="h-40 mt-2 flex items-end space-x-1 justify-between px-2">
                {mockTimelineData.map(data => (
                  <div key={data.date} className="flex flex-col items-center flex-1">
                    <div className="flex flex-col w-full space-y-1">
                      <div 
                        className="bg-green-500 w-full rounded-t"
                        style={{ height: `${(data.income / 3000) * 100}px` }}
                      />
                      <div 
                        className="bg-red-500 w-full rounded-t"
                        style={{ height: `${(data.expense / 3000) * 100}px` }}
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
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Income:</span>
                  <span className="text-sm font-medium text-green-600">
                    ${mockTimelineData.reduce((sum, data) => sum + data.income, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Expenses:</span>
                  <span className="text-sm font-medium text-red-600">
                    ${mockTimelineData.reduce((sum, data) => sum + data.expense, 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-sm font-medium">Net Savings:</span>
                  <span className="text-sm font-medium">
                    ${mockTimelineData.reduce((sum, data) => sum + data.income - data.expense, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <WireframeButton variant="secondary">
          <div className="flex items-center justify-center">
            <Calendar size={18} className="mr-1" />
            <span>Export Report</span>
          </div>
        </WireframeButton>
      </div>
    </WireframeContainer>
  );
};

export default ReportsScreen;
