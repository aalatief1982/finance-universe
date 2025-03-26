import React, { useState, useEffect } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { Plus, BarChart, CreditCard, DollarSign, Filter, Settings, MessageSquare } from 'lucide-react';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
}

interface DashboardScreenProps {
  onAddTransaction: () => void;
  onReports: () => void;
  onImportSms: () => void;
  onSettings: () => void;
  userData?: UserData;
}

const DashboardScreen = ({ onAddTransaction, onReports, onImportSms, onSettings, userData }: DashboardScreenProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [period, setPeriod] = useState('month');
  const { transactions, getTransactionsSummary } = useTransactions();
  const { user } = useUser();
  
  // Filter transactions based on activeTab
  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    return activeTab === 'income' ? tx.amount > 0 : tx.amount < 0;
  }).slice(0, 5); // Just show the most recent 5
  
  // Calculate summary statistics
  const { income, expenses, balance } = getTransactionsSummary();

  return (
    <WireframeContainer>
      <WireframeHeader title={`${userData?.name ? `Hi, ${userData.name.split(' ')[0]}` : 'Dashboard'}`} />
      
      <div className="mb-4">
        <div className="bg-blue-600 text-white rounded-lg p-4 mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm opacity-80">Current Balance</span>
            <DollarSign size={18} className="opacity-80" />
          </div>
          <h2 className="text-2xl font-bold">${balance.toFixed(2)}</h2>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <span className="block opacity-80">Income</span>
              <span className="font-semibold">+${income.toFixed(2)}</span>
            </div>
            <div>
              <span className="block opacity-80">Expenses</span>
              <span className="font-semibold">-${expenses.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
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
        
        <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <BarChart className="mx-auto text-gray-400 mb-2" size={24} />
            <span className="text-sm text-gray-500">Expense Chart</span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-white border rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <CreditCard size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{tx.title}</h3>
                    <span className="text-xs text-gray-500">{tx.date} • {tx.category}</span>
                  </div>
                </div>
                <span className={`font-semibold ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 bg-gray-50 border rounded-lg">
              <p className="text-gray-500 mb-2">No transactions to display</p>
              <div className="flex justify-center space-x-2">
                <WireframeButton onClick={onAddTransaction} variant="secondary" size="small">
                  <Plus size={14} className="mr-1" /> Add Manually
                </WireframeButton>
                <WireframeButton onClick={onImportSms} variant="secondary" size="small">
                  <MessageSquare size={14} className="mr-1" /> Import SMS
                </WireframeButton>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <WireframeButton 
          onClick={onAddTransaction}
          variant="primary"
        >
          <div className="flex items-center justify-center">
            <Plus size={18} className="mr-1" />
            <span>Add Transaction</span>
          </div>
        </WireframeButton>
        
        <button 
          className="p-2 bg-gray-200 rounded-lg"
          onClick={onReports}
        >
          <BarChart size={20} />
        </button>
        
        <button className="p-2 bg-gray-200 rounded-lg"
          onClick={onImportSms}
        >
          <MessageSquare size={20} />
        </button>
        
        <button className="p-2 bg-gray-200 rounded-lg" onClick={onSettings}>
          <Settings size={20} />
        </button>
      </div>
    </WireframeContainer>
  );
};

export default DashboardScreen;
