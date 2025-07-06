
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, ArrowDown, ArrowUp, Calendar, Tag, CreditCard, Receipt } from 'lucide-react';

interface AddTransactionScreenProps {
  onCancel: () => void;
  onSave: () => void;
}

const CATEGORIES = [
  'Food', 'Transportation', 'Housing', 'Entertainment', 
  'Shopping', 'Utilities', 'Health', 'Education', 'Travel', 'Other'
];

const AddTransactionScreen = ({ onCancel, onSave }: AddTransactionScreenProps) => {
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!date) {
      newErrors.date = 'Please select a date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      // In a real app, save the transaction
      if (process.env.NODE_ENV === 'development') console.log({
        type: transactionType,
        amount: Number(amount) * (transactionType === 'expense' ? -1 : 1),
        category,
        date,
        description
      });
      onSave(); // Call the onSave prop
    }
  };

  return (
    <WireframeContainer>
      <WireframeHeader 
        title="Add Transaction" 
        onBack={onCancel}
      />
      
      <div className="space-y-4">
        <div className="flex mb-4 rounded-lg overflow-hidden border">
          <button 
            className={`flex-1 py-2 ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setTransactionType('expense')}
          >
            <div className="flex items-center justify-center">
              <ArrowDown size={18} className="mr-1" />
              <span>Expense</span>
            </div>
          </button>
          <button 
            className={`flex-1 py-2 ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setTransactionType('income')}
          >
            <div className="flex items-center justify-center">
              <ArrowUp size={18} className="mr-1" />
              <span>Income</span>
            </div>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              type="text"
              placeholder="0.00"
              className={`pl-8 ${errors.amount ? 'border-red-500' : ''} dark:bg-white dark:text-black`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Category</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={`pl-8 ${errors.category ? 'border-red-500' : ''} dark:bg-white dark:text-black`}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <Input
              type="date"
              className={`pl-8 ${errors.date ? 'border-red-500' : ''} dark:bg-white dark:text-black`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Description</label>
          <div className="relative">
            <Receipt className="absolute left-3 top-3 text-gray-500" size={16} />
            <textarea 
              placeholder="Add a description" 
              className="w-full p-2 pl-8 border rounded-lg min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <WireframeButton 
            onClick={handleSubmit}
            variant="primary"
          >
            Save Transaction
          </WireframeButton>
          
          <button 
            className="p-2 bg-gray-200 rounded-lg"
            onClick={onCancel}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </WireframeContainer>
  );
};

export default AddTransactionScreen;
