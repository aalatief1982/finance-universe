
import React from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import { CreditCard, List, PieChart, Plus, Settings } from 'lucide-react';

interface DashboardScreenProps {
  onAddTransaction: () => void;
  onReports: () => void;
}

const DashboardScreen = ({ 
  onAddTransaction, 
  onReports 
}: DashboardScreenProps) => {
  return (
    <WireframeContainer>
      <WireframeHeader title="Dashboard" />
      <div className="space-y-4">
        <div className="bg-blue-600 text-white p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Total Balance</span>
            <span>USD</span>
          </div>
          <h2 className="text-2xl font-bold">$5,342.56</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-100 p-3 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <CreditCard className="text-green-600" size={32} />
            </div>
            <span className="text-sm">Income</span>
            <div className="font-bold text-green-700">$7,500</div>
          </div>
          <div className="bg-red-100 p-3 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <List className="text-red-600" size={32} />
            </div>
            <span className="text-sm">Expenses</span>
            <div className="font-bold text-red-700">$2,157</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="font-bold">Recent Transactions</span>
            <PieChart className="text-blue-600" size={24} />
          </div>
          {[
            { name: "Grocery Shopping", amount: "-$150", color: "text-red-500" },
            { name: "Salary", amount: "+$5,000", color: "text-green-500" },
            { name: "Gas", amount: "-$75", color: "text-red-500" }
          ].map((transaction, index) => (
            <div 
              key={index} 
              className="flex justify-between py-2 border-b last:border-b-0"
            >
              <span>{transaction.name}</span>
              <span className={transaction.color}>{transaction.amount}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-around bg-gray-100 p-2 rounded-lg">
          <button onClick={onAddTransaction}>
            <Plus className="text-blue-600" size={32} />
          </button>
          <button onClick={onReports}>
            <PieChart className="text-blue-600" size={32} />
          </button>
          <CreditCard className="text-blue-600" size={32} />
          <Settings className="text-blue-600" size={32} />
        </div>
      </div>
    </WireframeContainer>
  );
};

export default DashboardScreen;
