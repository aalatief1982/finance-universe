
import React from 'react';
import CurrencySelector from '../../CurrencySelector';
import { DollarSign } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  currency: string;
  setCurrency: (currency: string) => void;
}

const BalanceCard = ({ 
  balance, 
  income, 
  expenses, 
  currency, 
  setCurrency 
}: BalanceCardProps) => {
  // Format currency based on selection
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-blue-600 text-white rounded-lg p-4 mb-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm opacity-80">Current Balance</span>
        <div className="flex items-center">
          <CurrencySelector 
            value={currency}
            onChange={setCurrency}
            darkMode={true}
          />
          <DollarSign size={18} className="opacity-80 ml-1" />
        </div>
      </div>
      <h2 className="text-2xl font-bold">{formatCurrency(balance)}</h2>
      <div className="flex justify-between mt-4 text-sm">
        <div>
          <span className="block opacity-80">Income</span>
          <span className="font-semibold">{formatCurrency(income)}</span>
        </div>
        <div>
          <span className="block opacity-80">Expenses</span>
          <span className="font-semibold">-{formatCurrency(expenses)}</span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
