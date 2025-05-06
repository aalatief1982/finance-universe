import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { getCategoriesForType, getSubcategoriesForCategory, PEOPLE, CURRENCIES } from '@/lib/categories-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';
import styles from '../TransactionEditForm.module.css';

interface TransactionEditFormProps {
  transaction?: Transaction;
  onSave: (transaction: Transaction) => void;
}

function getDrivenFieldStyle(field: keyof Transaction, drivenFields: Partial<Record<keyof Transaction, boolean>>) {
  return drivenFields[field]
    ? { border: '2px solid #4caf50', backgroundColor: '#f0fff4' }
    : {};
}

function generateAutoTitle(txn: Transaction): string {
  if (!txn.category || txn.category === 'Uncategorized') return '';
  if (!txn.subcategory || txn.subcategory === 'none') return '';
  if (!txn.amount || !txn.date) return '';

  const formattedDate = typeof txn.date === 'string' ? txn.date.replace(/-/g, '') : ''; // format as ddMMyyyy
  return [txn.category, txn.subcategory, txn.amount, formattedDate].join('|');
}

function generateDefaultTitle(txn: Transaction): string {
  const category = txn.category || '';
  const subcategory = txn.subcategory || '';
  const amount = txn.amount || '';
  const date = typeof txn.date === 'string' ? txn.date.replace(/-/g, '').slice(0, 10) : '';
  return [category, subcategory, amount, date]
    .filter(Boolean)
    .join('|');
}

//function toISOFormat(ddmmyyyy: string): string {
 // if (!ddmmyyyy || ddmmyyyy.includes('undefined')) return '';
 // const [dd, mm, yyyy] = ddmmyyyy.split('-');
 // if (yyyy?.length === 4) return `${yyyy}-${mm}-${dd}`;
//  return '';
//}

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

  // Fallback must also be trimmed!
  const fallback = new Date(input);
  return isNaN(fallback.getTime()) ? '' : fallback.toISOString().split('T')[0];
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
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] = useState(false);
  const [drivenFields, setDrivenFields] = useState<Partial<Record<keyof Transaction, boolean>>>({});
  
  const [editedTransaction, setEditedTransaction] = useState<Transaction>(() => {
    if (transaction) {
      console.log('[TransactionEditForm] Initializing with transaction:', transaction);
      const mappedVendor = remapVendor(transaction.vendor);
	  const displayDate = transaction.date ? toDisplayFormat(transaction.date) : ''; 
	  
	  const transactionRawMessage = transaction.details?.rawMessage || '';
	  
	  console.log('[useState] transaction details:', transaction.details);
	  console.log('[useState] transaction.description:', transaction?.description);
     
      return {
        ...transaction,
        vendor: mappedVendor,
        title: transaction.title?.trim() || generateDefaultTitle(transaction),
        date: transaction.date ? toISOFormat(transaction.date) : '',
        description: transaction.description?.trim() || transactionRawMessage,
      };
    }

    return {
      id: uuidv4(),
      title: '',
      amount: 0,
      type: 'expense' as TransactionType,
      category: 'Uncategorized',
      date: new Date().toISOString().split('T')[0],
      fromAccount: 'Cash',
      currency: 'SAR',
      description: '',
      notes: '',
      source: 'manual',
    };
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  console.log('[useState result] editedTransaction.description:', editedTransaction.description);

  useEffect(() => {
    if (transaction) {
      const driven: Partial<Record<keyof Transaction, boolean>> = {};
      if (transaction.details?.rawMessage) {
        ['type','title','amount', 'currency', 'vendor', 'fromAccount', 'date', 'category', 'subcategory'].forEach((field) => {
          const value = transaction[field as keyof Transaction];
          if (value && typeof value === 'string' && value.trim()) {
            driven[field as keyof Transaction] = true;
          }
        });
      }
      setDrivenFields(driven);
    }
  }, [transaction]);

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
	  
      // Trigger auto-title update if not manually overridden
      if (!titleManuallyEdited) {
        const newTitle = generateAutoTitle({ ...updated });
        updated.title = newTitle;
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

    const rawAmount = parseFloat(String(finalTransaction.amount));
    if (finalTransaction.type === 'expense') {
      finalTransaction.amount = -Math.abs(rawAmount);
    } else {
      finalTransaction.amount = Math.abs(rawAmount);
    }
    
    // Ensure date is in ISO format
    if (typeof finalTransaction.date === 'string') {
      finalTransaction.date = toISOFormat(finalTransaction.date);
    }
    
    console.log('[drivenFields]', drivenFields);
    onSave(finalTransaction);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaction Type*</label>
        <Select value={editedTransaction.type} onValueChange={(value) => handleChange('type', value as TransactionType)}>
          
		  
		     <SelectTrigger style={getDrivenFieldStyle('type', drivenFields)}>
			  <SelectValue placeholder="Select type" />
			</SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Title*</label>
        <Input
			  value={editedTransaction.title || ''}
			  onChange={(e) => {
				setTitleManuallyEdited(true);
				handleChange('title', e.target.value);
			  }}
			  style={getDrivenFieldStyle('title', drivenFields)}
			  placeholder="Transaction title"
			  required
			/>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount*</label>
          <Input
            type="number"
            step="0.01"
            value={editedTransaction.amount}
			style={getDrivenFieldStyle('amount', drivenFields)}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Currency*</label>
          <Select value={editedTransaction.currency || 'USD'} onValueChange={(value) => handleChange('currency', value)}>
            <SelectTrigger style={getDrivenFieldStyle('currency', drivenFields)}>
			  <SelectValue placeholder="Select currency" />
			</SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(currency => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">From Account*</label>
        <Input value={editedTransaction.fromAccount || ''} onChange={(e) => handleChange('fromAccount', e.target.value)} style={getDrivenFieldStyle('fromAccount', drivenFields)} placeholder="Source account" required />
      </div>

      {editedTransaction.type === 'transfer' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">To Account*</label>
          <Input value={editedTransaction.toAccount || ''} onChange={(e) => handleChange('toAccount', e.target.value)} placeholder="Destination account" required />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Vendor</label>
        <Input value={editedTransaction.vendor || ''} style={getDrivenFieldStyle('vendor', drivenFields)} onChange={(e) => handleChange('vendor', e.target.value)} placeholder="e.g., Netflix" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category*</label>
          <Select value={editedTransaction.category || ''} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger style={getDrivenFieldStyle('category', drivenFields)}>
				  <SelectValue placeholder="Select category" />
				</SelectTrigger>
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
              <SelectTrigger style={getDrivenFieldStyle('subcategory', drivenFields)}>
				  <SelectValue placeholder="Select subcategory" />
				</SelectTrigger>
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
		  value={editedTransaction.date || ''}
		  onChange={(e) => handleChange('date', e.target.value)}
		  style={getDrivenFieldStyle('date', drivenFields)}
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
        <Textarea
			  value={editedTransaction.description || ''}
			  onChange={(e) => {
				setDescriptionManuallyEdited(true);
				console.log('[onChange] User manually edited description:', e.target.value);
				handleChange('description', e.target.value);
			  }}
			  placeholder="Enter a detailed description..."
			  className="min-h-[100px]"
			/>
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
