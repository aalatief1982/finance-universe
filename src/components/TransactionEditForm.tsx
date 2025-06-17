import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { getCategoriesForType, getSubcategoriesForCategory, PEOPLE, CURRENCIES } from '@/lib/categories-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionEditFormProps {
  transaction?: Transaction;
  onSave: (transaction: Transaction) => void;
}

function getDrivenFieldStyle(field: keyof Transaction, drivenFields: Partial<Record<keyof Transaction, boolean>>) {
  return drivenFields[field]
    ? { border: '2px solid #4caf50', backgroundColor: '#f0fff4' }
    : {};
}

export function generateDefaultTitle(txn: Transaction): string {
  const subcategory = txn.subcategory && txn.subcategory !== 'none' ? txn.subcategory : '';
  const amount = txn.amount ? parseFloat(txn.amount.toString()).toFixed(2) : '';
  const currency = txn.currency ? txn.currency.toUpperCase() : '';
  return subcategory && amount && currency ? `${subcategory} (${amount} ${currency})` : '';
}

function toISOFormat(input: string): string {
  if (!input || input.includes('undefined')) return '';
  const normalized = input.trim().replace(/\s+/g, ' ').replace(/[.\/]/g, '-');
  const dmy = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmy) {
    let [_, dd, mm, yyyy] = dmy;
    dd = dd.padStart(2, '0');
    mm = mm.padStart(2, '0');
    if (yyyy.length === 2) yyyy = parseInt(yyyy) < 50 ? `20${yyyy}` : `19${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  const ymd = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    let [_, yyyy, mm, dd] = ymd;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const fallback = new Date(input);
  return isNaN(fallback.getTime()) ? '' : fallback.toISOString().split('T')[0];
}

function remapVendor(vendor?: string): string {
  if (!vendor) return '';
  const map = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] && map[vendor].trim() !== '' ? map[vendor] : vendor;
}

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({ transaction, onSave }) => {
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] = useState(false);
  const [drivenFields, setDrivenFields] = useState<Partial<Record<keyof Transaction, boolean>>>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  const [editedTransaction, setEditedTransaction] = useState<Transaction>(() => {
    if (transaction) {
      const mappedVendor = remapVendor(transaction.vendor);
      const displayDate = transaction.date ? toISOFormat(transaction.date) : '';
      const rawMessage = (transaction as any).rawMessage || transaction.details?.rawMessage || '';

      return {
        ...transaction,
        vendor: mappedVendor,
        title: transaction.title?.trim() || generateDefaultTitle(transaction),
        date: displayDate,
        description: transaction.description?.trim() || rawMessage,
      };
    }

    return {
      id: '',
      title: '',
      amount: 0,
      type: 'expense',
      category: 'Uncategorized',
      subcategory: 'none',
      date: new Date().toISOString().split('T')[0],
      fromAccount: 'Cash',
      currency: 'SAR',
      description: '',
      notes: '',
      source: 'manual',
    };
  });

  useEffect(() => {
    if (transaction) {
      const driven: Partial<Record<keyof Transaction, boolean>> = {};
      if (transaction.source === 'smart-paste' || transaction.details?.rawMessage) {
        ['type', 'title', 'amount', 'currency', 'vendor', 'fromAccount', 'date', 'category', 'subcategory'].forEach((field) => {
          const value = transaction[field as keyof Transaction];
          const isDriven =
            value != null &&
            ((typeof value === 'string' && value.trim() !== '') || typeof value === 'number') &&
            !(field === 'category' && value === 'Uncategorized') &&
            !(field === 'subcategory' && value === 'none');
          if (isDriven) driven[field as keyof Transaction] = true;
        });
      }
      setDrivenFields(driven);
    }
  }, [transaction]);

  useEffect(() => {
    const categories = getCategoriesForType(editedTransaction.type) || [];
    setAvailableCategories(categories);
    const subcategories = getSubcategoriesForCategory(editedTransaction.category) || [];
    setAvailableSubcategories(subcategories);
  }, [editedTransaction.type, editedTransaction.category]);

  const handleChange = (field: keyof Transaction, value: string | number | TransactionType) => {
    setEditedTransaction(prev => {
      const updated = { ...prev, [field]: value };

      if (drivenFields[field]) {
        setDrivenFields(prev => ({ ...prev, [field]: false }));
      }

      if (field === 'type') {
        updated.category = 'Uncategorized';
        updated.subcategory = 'none';
      }

      if (field === 'category') {
        const subcategories = getSubcategoriesForCategory(value as string) || [];
        setAvailableSubcategories(subcategories);
        updated.subcategory = 'none';
      }

      if (!titleManuallyEdited) {
        updated.title = generateDefaultTitle(updated);
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTransaction = { ...editedTransaction };

    if (!finalTransaction.title?.trim()) {
      finalTransaction.title = generateDefaultTitle(finalTransaction);
    }

    const rawAmount = parseFloat(String(finalTransaction.amount));
    finalTransaction.amount = finalTransaction.type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount);

    if (typeof finalTransaction.date === 'string') {
      finalTransaction.date = toISOFormat(finalTransaction.date);
    }

    onSave(finalTransaction);
  };

  const amountDigits =
    editedTransaction.amount !== undefined && editedTransaction.amount !== null
      ? editedTransaction.amount.toString().split('.')[0].replace('-', '').length
      : 0;
  const amountFontClass =
    amountDigits > 5 ? 'text-lg md:text-xl' : 'text-xl md:text-2xl';

  return (
    <form
      onSubmit={handleSubmit}

      className="bg-white p-4 rounded-md shadow-sm space-y-2 mb-28"
    >

      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Type*</label>

        <Select
          value={editedTransaction.type}
          onValueChange={(value) => handleChange('type', value as TransactionType)}
        >
          <SelectTrigger
            className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
            style={getDrivenFieldStyle('type', drivenFields)}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Title*</label>

        <Input
          value={editedTransaction.title || ''}
          onChange={(e) => {
            setTitleManuallyEdited(true);
            handleChange('title', e.target.value);
          }}
          style={getDrivenFieldStyle('title', drivenFields)}
          placeholder="Transaction title"
          required
          className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
        />
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Currency*</label>

        <Select
          value={editedTransaction.currency || 'SAR'}
          onValueChange={(value) => handleChange('currency', value)}
        >
          <SelectTrigger
            className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
            style={getDrivenFieldStyle('currency', drivenFields)}
          >
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Amount*</label>

        <Input
          type="number"
          step="0.01"
          value={editedTransaction.amount}
          style={getDrivenFieldStyle('amount', drivenFields)}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
          placeholder="0.00"
          required
          className={cn(
            'w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary text-center truncate',
            amountFontClass
          )}
        />
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">From Account*</label>

        <Input
          value={editedTransaction.fromAccount || ''}
          onChange={(e) => handleChange('fromAccount', e.target.value)}
          style={getDrivenFieldStyle('fromAccount', drivenFields)}
          placeholder="Source account"
          required
          className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
        />
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Category*</label>

        <Select
          value={editedTransaction.category || ''}
          onValueChange={(value) => handleChange('category', value)}
        >
          <SelectTrigger
            className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
            style={getDrivenFieldStyle('category', drivenFields)}
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {availableSubcategories.length > 0 && (

        <div className="flex items-center gap-2">
          <label className="w-32 text-sm font-semibold text-gray-700">Subcategory</label>

          <Select
            value={editedTransaction.subcategory || 'none'}
            onValueChange={(value) => handleChange('subcategory', value)}
          >
            <SelectTrigger
              className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
              style={getDrivenFieldStyle('subcategory', drivenFields)}
            >
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {availableSubcategories.map((subcategory) => (
                <SelectItem key={subcategory} value={subcategory}>
                  {subcategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Person (Optional)</label>

        <Select
          value={editedTransaction.person || 'none'}
          onValueChange={(value) => handleChange('person', value)}
        >
          <SelectTrigger className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary">
            <SelectValue placeholder="Select person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {PEOPLE.map((person) => (
              <SelectItem key={person} value={person}>
                {person}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Vendor</label>

        <Input
          value={editedTransaction.vendor || ''}
          style={getDrivenFieldStyle('vendor', drivenFields)}
          onChange={(e) => handleChange('vendor', e.target.value)}
          placeholder="e.g., Netflix"
          className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
        />
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Date*</label>

        <Input
          type="date"
          value={editedTransaction.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          style={getDrivenFieldStyle('date', drivenFields)}
          required
          className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
        />
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Description (Optional)</label>

        <Textarea
          value={editedTransaction.description || ''}
          onChange={(e) => {
            setDescriptionManuallyEdited(true);
            handleChange('description', e.target.value);
          }}
          placeholder="Enter a detailed description..."
          rows={2}
          className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
        />
      </div>


      <div className="flex items-center gap-2">
        <label className="w-32 text-sm font-semibold text-gray-700">Notes (Optional)</label>

        <Textarea
          value={editedTransaction.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes..."
          rows={2}
          className="w-full text-sm py-2 px-3 rounded-md border-gray-300 focus:ring-primary"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="bg-primary text-white w-full py-3 rounded-md">
          {transaction ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionEditForm;
