
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';

interface AddTransactionScreenProps {
  onCancel: () => void;
}

const AddTransactionScreen = ({ onCancel }: AddTransactionScreenProps) => {
  const [transactionType, setTransactionType] = useState('expense');
  const categories = {
    expense: ['Shopping', 'Car', 'Health', 'Education', 'Others'],
    income: ['Salary', 'Investment', 'Transfer'],
    transfer: ['Local Bank', 'International Bank']
  };

  return (
    <WireframeContainer>
      <WireframeHeader title="Add Transaction" onBack={onCancel} />
      <div className="space-y-4">
        <div className="flex space-x-2">
          {['expense', 'income', 'transfer'].map(type => (
            <button
              key={type}
              className={`flex-1 py-2 rounded-lg ${
                transactionType === type 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-black'
              }`}
              onClick={() => setTransactionType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input 
            type="number" 
            placeholder="Amount" 
            className="w-full p-2 border rounded-lg"
          />
          <select className="w-full p-2 border rounded-lg">
            <option>Select Currency</option>
            <option>USD</option>
            <option>SAR</option>
            <option>EGP</option>
          </select>
          <select className="w-full p-2 border rounded-lg">
            <option>Select Category</option>
            {categories[transactionType as keyof typeof categories].map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select className="w-full p-2 border rounded-lg">
            <option>Select Person (Optional)</option>
            <option>Ahmed</option>
            <option>Marwa</option>
            <option>Youssef</option>
          </select>
          <input 
            type="text" 
            placeholder="Description (Optional)" 
            className="w-full p-2 border rounded-lg"
          />
          <WireframeButton>Save Transaction</WireframeButton>
        </div>
      </div>
    </WireframeContainer>
  );
};

export default AddTransactionScreen;
