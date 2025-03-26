
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import { Filter, Download } from 'lucide-react';

const ReportsScreen = () => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <WireframeContainer>
      <WireframeHeader title="Reports" />
      <div className="space-y-4">
        <div className="flex space-x-2 mb-4">
          {['Summary', 'Detailed', 'Trends'].map(tab => (
            <button
              key={tab.toLowerCase()}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === tab.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-black'
              }`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Filter className="text-blue-600" size={24} />
            <span>Filters</span>
          </div>
          <button>
            <Download className="text-blue-600" size={24} />
          </button>
        </div>

        <div className="bg-white p-3 rounded-lg">
          {activeTab === 'summary' && (
            <div>
              <div className="flex justify-between mb-2">
                <span>Total Income</span>
                <span className="text-green-600">$7,500</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Total Expenses</span>
                <span className="text-red-600">$2,157</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Net Balance</span>
                <span>$5,343</span>
              </div>
            </div>
          )}
          {activeTab === 'detailed' && (
            <div>
              {[
                { date: "01 Mar", category: "Grocery", amount: "-$150" },
                { date: "15 Mar", category: "Salary", amount: "+$5,000" },
                { date: "20 Mar", category: "Gas", amount: "-$75" }
              ].map((transaction, index) => (
                <div 
                  key={index} 
                  className="flex justify-between py-2 border-b last:border-b-0"
                >
                  <span>{transaction.date}</span>
                  <span>{transaction.category}</span>
                  <span className={transaction.amount.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'trends' && (
            <div className="bg-gray-100 h-48 flex items-center justify-center">
              <span>Trend Chart Placeholder</span>
            </div>
          )}
        </div>
      </div>
    </WireframeContainer>
  );
};

export default ReportsScreen;
