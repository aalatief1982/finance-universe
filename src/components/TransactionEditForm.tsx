import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import { getCategoriesForType, getSubcategoriesForCategory, PEOPLE, CURRENCIES } from '@/lib/categories-data';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionEditFormProps {
  transaction?: Transaction;
  onSave: (transaction: Transaction) => void;
  /** Display form in a compact layout with reduced spacing */
  compact?: boolean;
  /** Whether to display the notes field */
  showNotes?: boolean;
}

function getDrivenFieldStyle(field: keyof Transaction, drivenFields: Partial<Record<keyof Transaction, boolean>>) {
  return drivenFields[field]
    ? { border: '2px solid #4caf50', backgroundColor: '#f0fff4' }
    : {};
}

/* export function generateDefaultTitle(txn: Transaction): string {
  const subcategory = txn.subcategory && txn.subcategory !== 'none' ? txn.subcategory : '';
  const amount = txn.amount ? parseFloat(txn.amount.toString()).toFixed(2) : '';
  const currency = txn.currency ? txn.currency.toUpperCase() : '';
  return subcategory && amount && currency ? `${subcategory} (${amount} ${currency})` : '';
} */

  export function generateDefaultTitle(txn: Transaction): string {
  const label = txn.vendor?.trim() || (txn.subcategory && txn.subcategory !== 'none' ? txn.subcategory : '');
  const amount = txn.amount ? parseFloat(txn.amount.toString()).toFixed(2) : '';
  const currency = txn.currency?.toUpperCase() || '';

  return label && amount && currency ? `${label} - ${amount} ${currency}` : '';
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

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transaction,
  onSave,
  compact = false,
  showNotes = true,
}) => {
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] = useState(false);
  const [drivenFields, setDrivenFields] = useState<Partial<Record<keyof Transaction, boolean>>>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const CUSTOM_CURRENCIES_KEY = 'xpensia_custom_currencies';
  type CustomCurrency = {
    code: string;
    country: string;
    conversionRate?: number;
    isCustom: boolean;
  };
  const loadCurrencies = (): string[] => {
    const base = [...CURRENCIES];
    try {
      const raw = localStorage.getItem(CUSTOM_CURRENCIES_KEY);
      if (raw) {
        const custom: CustomCurrency[] = JSON.parse(raw);
        base.push(...custom.map(c => c.code));
      }
    } catch {
      // ignore
    }
    return base;
  };
  const [currencies, setCurrencies] = useState<string[]>(() => loadCurrencies());
  const [addCurrencyOpen, setAddCurrencyOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: '', country: '', rate: '' });

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
        toAccount: transaction.toAccount || '',
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
      toAccount: '',
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
        ['type', 'title', 'amount', 'currency', 'vendor', 'fromAccount', 'toAccount', 'date', 'category', 'subcategory'].forEach((field) => {
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
        if (value !== 'transfer') {
          updated.toAccount = '';
        }
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

  const handleSaveCurrency = () => {
    if (!newCurrency.code.trim() || !newCurrency.country.trim()) return;
    const currencyObj: CustomCurrency = {
      code: newCurrency.code.trim().toUpperCase(),
      country: newCurrency.country.trim(),
      conversionRate: newCurrency.rate ? parseFloat(newCurrency.rate) : undefined,
      isCustom: true,
    };
    try {
      const raw = localStorage.getItem(CUSTOM_CURRENCIES_KEY);
      const arr: CustomCurrency[] = raw ? JSON.parse(raw) : [];
      arr.push(currencyObj);
      localStorage.setItem(CUSTOM_CURRENCIES_KEY, JSON.stringify(arr));
    } catch {
      // ignore
    }
    setCurrencies(prev => [...prev, currencyObj.code]);
    handleChange('currency', currencyObj.code);
    setNewCurrency({ code: '', country: '', rate: '' });
    setAddCurrencyOpen(false);
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


  const rowClass = cn('flex items-center', compact ? 'gap-1' : 'gap-2');
  const labelClass = cn(
    compact ? 'w-24 md:w-28' : 'w-32',
    'text-sm font-semibold text-gray-700'
  );
  const inputPadding = compact ? 'py-1 px-2' : 'py-2 px-3';
  const formClass = cn(
    'bg-white p-4 rounded-md shadow-sm',
    compact ? 'space-y-1 pb-16' : 'space-y-2 pb-28'
  );

  return (
    <form onSubmit={handleSubmit} className={formClass}>

      <div className={rowClass}>
        <label className={labelClass}>Type*</label>

        <Select
          value={editedTransaction.type}
          onValueChange={(value) => handleChange('type', value as TransactionType)}
        >
          <SelectTrigger
            className={cn(
              'w-full text-sm',
              inputPadding,
              'rounded-md border-gray-300 focus:ring-primary'
            )}
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


      <div className={rowClass}>
        <label className={labelClass}>Title*</label>

        <Input
          value={editedTransaction.title || ''}
          onChange={(e) => {
            setTitleManuallyEdited(true);
            handleChange('title', e.target.value);
          }}
          style={getDrivenFieldStyle('title', drivenFields)}
          placeholder="Transaction title"
          required
          className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
        />
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Currency*</label>

        <div className="flex w-full items-center gap-1">
          <Select
            value={editedTransaction.currency || 'SAR'}
            onValueChange={(value) => handleChange('currency', value)}
          >
            <SelectTrigger
              className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
              style={getDrivenFieldStyle('currency', drivenFields)}
            >
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={() => setAddCurrencyOpen(true)}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={addCurrencyOpen} onOpenChange={setAddCurrencyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Currency</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Short Name*</label>
              <Input value={newCurrency.code} onChange={e => setNewCurrency(prev => ({ ...prev, code: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country*</label>
              <Input value={newCurrency.country} onChange={e => setNewCurrency(prev => ({ ...prev, country: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Conversion Rate</label>
              <Input type="number" step="0.0001" value={newCurrency.rate} onChange={e => setNewCurrency(prev => ({ ...prev, rate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddCurrencyOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveCurrency}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className={rowClass}>
        <label className={labelClass}>Amount*</label>

        <Input
          type="number"
          step="0.01"
          value={editedTransaction.amount}
          style={getDrivenFieldStyle('amount', drivenFields)}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
          placeholder="0.00"
          required
          className={cn(
            'w-full text-sm rounded-md border-gray-300 focus:ring-primary',
            inputPadding
          )}
        />
      </div>


      <div className={rowClass}>
        <label className={labelClass}>From Account*</label>

        <Input
          value={editedTransaction.fromAccount || ''}
          onChange={(e) => handleChange('fromAccount', e.target.value)}
          style={getDrivenFieldStyle('fromAccount', drivenFields)}
          placeholder="Source account"
          required
          className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
        />
      </div>

      {editedTransaction.type === 'transfer' && (
        <div className={rowClass}>
          <label className={labelClass}>To Account*</label>

          <Input
            value={editedTransaction.toAccount || ''}
            onChange={(e) => handleChange('toAccount', e.target.value)}
            style={getDrivenFieldStyle('toAccount', drivenFields)}
            placeholder="Destination account"
            required
            className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
          />
        </div>
      )}


      <div className={rowClass}>
        <label className={labelClass}>Category*</label>

        <Select
          value={editedTransaction.category || ''}
          onValueChange={(value) => handleChange('category', value)}
        >
          <SelectTrigger
            className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
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

      <div className={rowClass}>
        <label className={labelClass}>Subcategory</label>

        {availableSubcategories.length > 0 ? (
          <Select
            value={editedTransaction.subcategory || 'none'}
            onValueChange={(value) => handleChange('subcategory', value)}
          >
            <SelectTrigger
              className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
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
        ) : (
          <div className={cn('flex-1 text-sm text-gray-500', inputPadding)}>N/A</div>
        )}
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Person (Optional)</label>

        <Select
          value={editedTransaction.person || 'none'}
          onValueChange={(value) => handleChange('person', value)}
        >
          <SelectTrigger className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}>
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


      <div className={rowClass}>
        <label className={labelClass}>Vendor</label>

        <Input
          value={editedTransaction.vendor || ''}
          style={getDrivenFieldStyle('vendor', drivenFields)}
          onChange={(e) => handleChange('vendor', e.target.value)}
          placeholder="e.g., Netflix"
          className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
        />
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Date*</label>

        <Input
          type="date"
          value={editedTransaction.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          style={getDrivenFieldStyle('date', drivenFields)}
          required
          className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
        />
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Description (Optional)</label>

        <Textarea
          value={editedTransaction.description || ''}
          onChange={(e) => {
            setDescriptionManuallyEdited(true);
            handleChange('description', e.target.value);
          }}
          placeholder="Enter a detailed description..."
          rows={2}
          className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
        />
      </div>


      {showNotes && (
        <div className={rowClass}>
          <label className={labelClass}>Notes (Optional)</label>

          <Textarea
            value={editedTransaction.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className={cn('w-full text-sm', inputPadding, 'rounded-md border-gray-300 focus:ring-primary')}
          />
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          className={cn(
            'bg-primary text-white w-full rounded-md',
            compact ? 'py-2' : 'py-3'
          )}
        >
          {transaction ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionEditForm;
