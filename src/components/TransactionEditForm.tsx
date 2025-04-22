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


function toISOFormat(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

function toDisplayFormat(yyyymmdd: string): string {
  const [yyyy, mm, dd] = yyyymmdd.split('-');
  return `${dd}-${mm}-${yyyy}`;
}


function remapVendor(vendor?: string): string {
  if (!vendor) return '';
  const map = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] || vendor;
}

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({ transaction, onSave }) => {
  const [editedTransaction, setEditedTransaction] = useState<Transaction>(() => {
    if (transaction) {
      console.log('[TransactionEditForm] Initializing with transaction:', transaction);
      const mappedVendor = remapVendor(transaction.vendor);
     return {
      ...transaction,
      vendor: mappedVendor,
      date: transaction.date,
    };
    }


    return {
      id: uuidv4(),
      title: '',
      amount: '',
      type: 'expense' as TransactionType,
      category: 'Uncategorized',
      //date: new Date().toISOString().split('T')[0],
	  date: toDisplayFormat(new Date().toISOString().split('T')[0]),
      fromAccount: 'Cash',
      currency: 'USD',
      description: '',
      notes: '',
      source: 'manual',
    };
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  useEffect(() => {
    const categories = getCategoriesForType(editedTransaction.type) || [];
    setAvailableCategories(categories);

    if (editedTransaction.category) {
      const subcategories = getSubcategoriesForCategory(editedTransaction.category) || [];
      setAvailableSubcategories(subcategories);
    } else {
      setAvailableSubcategories([]);
    }
  }, [editedTransaction.type]);

  const handleChange = (field: keyof Transaction, value: string | number | TransactionType) => {
    setEditedTransaction(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'type') {
        updated.category = 'Uncategorized';
        updated.subcategory = 'none';
      }

      if (field === 'category') {
        const subcategories = getSubcategoriesForCategory(value as string) || [];
        setAvailableSubcategories(subcategories);
        updated.subcategory = 'none';
      }

      return updated;
    });
  };

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const finalTransaction = { ...editedTransaction };

  // Default the title if empty
  if (!finalTransaction.title?.trim()) {
    finalTransaction.title = generateDefaultTitle(finalTransaction);
  }

  const rawAmount = parseFloat(finalTransaction.amount as any);
  if (finalTransaction.type === 'expense') {
    finalTransaction.amount = -Math.abs(rawAmount);
  } else {
    finalTransaction.amount = Math.abs(rawAmount);
  }

  onSave(finalTransaction);
};


  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaction Type*</label>
        <Select value={editedTransaction.type} onValueChange={(value) => handleChange('type', value as TransactionType)}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Title*</label>
        <Input value={editedTransaction.title || ''} onChange={(e) => handleChange('title', e.target.value)} placeholder="Transaction title" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount*</label>
          <Input
            type="number"
            step="0.01"
            value={editedTransaction.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Currency*</label>
          <Select value={editedTransaction.currency || 'USD'} onValueChange={(value) => handleChange('currency', value)}>
            <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(currency => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">From Account*</label>
        <Input value={editedTransaction.fromAccount || ''} onChange={(e) => handleChange('fromAccount', e.target.value)} placeholder="Source account" required />
      </div>

      {editedTransaction.type === 'transfer' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">To Account*</label>
          <Input value={editedTransaction.toAccount || ''} onChange={(e) => handleChange('toAccount', e.target.value)} placeholder="Destination account" required />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Vendor</label>
        <Input value={editedTransaction.vendor || ''} onChange={(e) => handleChange('vendor', e.target.value)} placeholder="e.g., Netflix" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category*</label>
          <Select value={editedTransaction.category || 'Uncategorized'} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {availableCategories.length > 0 ? (
                availableCategories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)
              ) : (
                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {availableSubcategories.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Subcategory</label>
            <Select value={editedTransaction.subcategory || 'none'} onValueChange={(value) => handleChange('subcategory', value)}>
              <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableSubcategories.map(subcategory => <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Date*</label>
        <Input
		  type="date"
		  value={toISOFormat(editedTransaction.date)}
		  onChange={(e) => handleChange('date', toDisplayFormat(e.target.value))}
		  required
		/>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Person (Optional)</label>
        <Select value={editedTransaction.person || 'none'} onValueChange={(value) => handleChange('person', value)}>
          <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {PEOPLE.map(person => <SelectItem key={person} value={person}>{person}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Textarea value={editedTransaction.description || ''} onChange={(e) => handleChange('description', e.target.value)} placeholder="Enter a detailed description..." className="min-h-[100px]" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (Optional)</label>
        <Textarea value={editedTransaction.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Additional notes..." className="min-h-[80px]" />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" className="flex items-center gap-1">
          <Check className="h-4 w-4" />
          {transaction ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionEditForm;
