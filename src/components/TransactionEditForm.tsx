
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { getCategoriesForType, getSubcategoriesForCategory, PEOPLE, CURRENCIES } from '@/lib/categories-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';

interface TransactionEditFormProps {
  transaction?: Transaction;
  onSave: (transaction: Transaction) => void;
}

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({ 
  transaction, 
  onSave 
}) => {
  const [editedTransaction, setEditedTransaction] = useState<Transaction>(() => {
    if (transaction) {
      return { ...transaction };
    }
    
    // Default new transaction
    return {
      id: uuidv4(),
      title: '',
      amount: 0,
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      fromAccount: 'Cash',
      currency: 'USD',
      description: '',
      notes: '',
      source: 'manual' // Add the required source field
    };
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  // Update categories when transaction type changes
  useEffect(() => {
    const categories = getCategoriesForType(editedTransaction.type as TransactionType);
    setAvailableCategories(categories);
    
    // If category is already set, update subcategories as well
    if (editedTransaction.category) {
      const subcategories = getSubcategoriesForCategory(editedTransaction.category);
      setAvailableSubcategories(subcategories);
    } else {
      setAvailableSubcategories([]);
    }
  }, [editedTransaction.type]);

  // Handle field changes
  const handleChange = (field: keyof Transaction, value: string | number | TransactionType) => {
    setEditedTransaction(prev => {
      const updated = {...prev, [field]: value};
      
      // Special case for transaction type
      if (field === 'type') {
        const transactionType = value as TransactionType;
        
        // Reset category when type changes
        updated.category = '';
        updated.subcategory = '';
      }
      
      // Special case for category
      if (field === 'category') {
        const subcategories = getSubcategoriesForCategory(value as string);
        setAvailableSubcategories(subcategories);
        
        // Reset subcategory when category changes
        updated.subcategory = '';
      }
      
      return updated;
    });
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure the amount is negative for expenses
    const finalTransaction = {...editedTransaction};
    if (finalTransaction.type === 'expense' && finalTransaction.amount > 0) {
      finalTransaction.amount = -Math.abs(finalTransaction.amount);
    } else if (finalTransaction.type !== 'expense' && finalTransaction.amount < 0) {
      finalTransaction.amount = Math.abs(finalTransaction.amount);
    }
    
    onSave(finalTransaction);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaction Type*</label>
        <Select 
          value={editedTransaction.type}
          onValueChange={(value) => handleChange('type', value as TransactionType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Title*</label>
        <Input 
          value={editedTransaction.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Transaction title"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount*</label>
          <Input 
            type="number" 
            step="0.01"
            value={Math.abs(editedTransaction.amount)}
            onChange={(e) => handleChange('amount', 
              editedTransaction.type === 'expense' 
                ? -Math.abs(parseFloat(e.target.value) || 0) 
                : Math.abs(parseFloat(e.target.value) || 0)
            )}
            placeholder="0.00"
            required
          />
        </div>
        
        {/* Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Currency*</label>
          <Select 
            value={editedTransaction.currency || 'USD'}
            onValueChange={(value) => handleChange('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(currency => (
                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* From Account */}
      <div className="space-y-2">
        <label className="text-sm font-medium">From Account*</label>
        <Input 
          value={editedTransaction.fromAccount || ''}
          onChange={(e) => handleChange('fromAccount', e.target.value)}
          placeholder="Source account"
          required
        />
      </div>
      
      {/* To Account - Only shown for Transfer */}
      {editedTransaction.type === 'transfer' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">To Account*</label>
          <Input 
            value={editedTransaction.toAccount || ''}
            onChange={(e) => handleChange('toAccount', e.target.value)}
            placeholder="Destination account"
            required
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Category*</label>
          <Select 
            value={editedTransaction.category}
            onValueChange={(value) => handleChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Subcategory */}
        {availableSubcategories.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Subcategory</label>
            <Select 
              value={editedTransaction.subcategory || 'none'}
              onValueChange={(value) => handleChange('subcategory', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableSubcategories.map(subcategory => (
                  <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date*</label>
        <Input 
          type="date"
          value={editedTransaction.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
        />
      </div>
      
      {/* Person */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Person (Optional)</label>
        <Select 
          value={editedTransaction.person || 'none'}
          onValueChange={(value) => handleChange('person', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {PEOPLE.map(person => (
              <SelectItem key={person} value={person}>{person}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Textarea 
          value={editedTransaction.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter a detailed description..."
          className="resize-none min-h-[80px]"
        />
      </div>
      
      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (Optional)</label>
        <Input 
          value={editedTransaction.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes..."
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="submit"
          className="flex items-center gap-1"
        >
          <Check className="h-4 w-4" />
          {transaction ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionEditForm;
