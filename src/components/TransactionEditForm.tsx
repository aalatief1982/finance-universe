import { safeStorage } from "@/utils/safe-storage";
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import {
  getCategoriesForType,
  getSubcategoriesForCategory,
  getCategoryHierarchy,
  PEOPLE,
  CURRENCIES,
} from '@/lib/categories-data';
import { Plus, Calculator, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getStoredAccounts, addUserAccount, Account } from '@/lib/account-utils';
import { getPeopleNames, addUserPerson } from '@/lib/people-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { addSuggestionsFeedbackEntry } from '@/utils/suggestions-feedback-log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import vendorData from '@/data/ksa_all_vendors_clean_final.json';
import { loadVendorFallbacks, addUserVendor } from '@/lib/smart-paste-engine/vendorFallbackUtils';

interface TransactionEditFormProps {
  transaction?: Transaction;
  onSave: (transaction: Transaction) => void;
  /** Display form in a compact layout with reduced spacing */
  compact?: boolean;
  /** Whether to display the notes field */
  showNotes?: boolean;
  /** Optional confidence scores for fields */
  fieldConfidences?: Partial<Record<keyof Transaction, number>>;
}


function isDriven(
  field: keyof Transaction,
  drivenFields: Partial<Record<keyof Transaction, boolean>>
) {
  return !!drivenFields[field]
}

function hasLowConfidence(
  field: keyof Transaction,
  scores: Partial<Record<keyof Transaction, number>>
) {
  const score = scores[field]
  return score !== undefined && score < 0.6
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
  const map = JSON.parse(safeStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] && map[vendor].trim() !== '' ? map[vendor] : vendor;
}

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transaction,
  onSave,
  compact = false,
  showNotes = true,
  fieldConfidences = {},
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
      const raw = safeStorage.getItem(CUSTOM_CURRENCIES_KEY);
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
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Partial<Record<keyof Transaction, boolean>>>({});
  const [accounts, setAccounts] = useState<Account[]>(() => getStoredAccounts());
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<{ name: string; iban: string }>({ name: '', iban: '' });

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<{
    type: TransactionType;
    category: string;
    subcategory: string;
  }>({ type: 'expense', category: '', subcategory: '' });

  const [people, setPeople] = useState<string[]>(() => getPeopleNames());
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPerson, setNewPerson] = useState<{ name: string; relation: string }>({ name: '', relation: '' });

  const [vendors, setVendors] = useState<string[]>(() => {
    const builtIn = Object.keys((vendorData as any) || {});
    const stored = Object.keys(loadVendorFallbacks());
    return Array.from(new Set([...builtIn, ...stored]));
  });
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<{ name: string; type: TransactionType; category: string; subcategory: string }>(
    { name: '', type: 'expense', category: '', subcategory: '' }
  );

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
      const raw = safeStorage.getItem(CUSTOM_CURRENCIES_KEY);
      const arr: CustomCurrency[] = raw ? JSON.parse(raw) : [];
      arr.push(currencyObj);
      safeStorage.setItem(CUSTOM_CURRENCIES_KEY, JSON.stringify(arr));
    } catch {
      // ignore
    }
    setCurrencies(prev => [...prev, currencyObj.code]);
    handleChange('currency', currencyObj.code);
    setNewCurrency({ code: '', country: '', rate: '' });
    setAddCurrencyOpen(false);
  };

  const handleSaveAccount = () => {
    if (!newAccount.name.trim()) return;
    addUserAccount({ name: newAccount.name.trim(), iban: newAccount.iban.trim() || undefined });
    setAccounts(getStoredAccounts());
    setNewAccount({ name: '', iban: '' });
    setAddAccountOpen(false);
  };

  const handleSaveCategory = () => {
    if (!newCategory.category.trim()) return;

    const hierarchy = getCategoryHierarchy();
    const normalizedCategory = newCategory.category.trim();
    const normalizedSubcategory = newCategory.subcategory.trim();

    let cat = hierarchy.find(
      (c) => c.type === newCategory.type && c.name.toLowerCase() === normalizedCategory.toLowerCase()
    );

    if (!cat) {
      cat = {
        id: normalizedCategory.toLowerCase().replace(/\s+/g, '-'),
        name: normalizedCategory,
        type: newCategory.type,
        subcategories: [],
        user: true,
      };
      hierarchy.push(cat);
    }

    if (normalizedSubcategory) {
      const exists = cat.subcategories.some(
        (sc) => sc.name.toLowerCase() === normalizedSubcategory.toLowerCase()
      );
      if (!exists) {
        cat.subcategories.push({
          id: normalizedSubcategory.toLowerCase().replace(/\s+/g, '-'),
          name: normalizedSubcategory,
          user: true,
        });
      }
    }

    safeStorage.setItem('xpensia_category_hierarchy', JSON.stringify(hierarchy));

    setAvailableCategories(getCategoriesForType(editedTransaction.type));
    setAvailableSubcategories(getSubcategoriesForCategory(editedTransaction.category));

    setNewCategory({ type: editedTransaction.type, category: '', subcategory: '' });
    setAddCategoryOpen(false);
  };

  const handleSavePerson = () => {
    if (!newPerson.name.trim()) return;
    addUserPerson({ name: newPerson.name.trim(), relation: newPerson.relation.trim() || undefined });
    setPeople(getPeopleNames());
    handleChange('person', newPerson.name.trim());
    setNewPerson({ name: '', relation: '' });
    setAddPersonOpen(false);
  };

  const handleSaveVendor = () => {
    if (!newVendor.name.trim()) return;
    addUserVendor(newVendor.name.trim(), {
      type: newVendor.type,
      category: newVendor.category.trim(),
      subcategory: newVendor.subcategory.trim(),
    });
    setVendors(prev => Array.from(new Set([...prev, newVendor.name.trim()])));
    handleChange('vendor', newVendor.name.trim());
    setNewVendor({ name: '', type: 'expense', category: '', subcategory: '' });
    setAddVendorOpen(false);
  };

  const handleCalcInput = (val: string) => {
    setCalcExpr(prev => prev + val);
  };

  const clearCalc = () => setCalcExpr('');

  const evaluateCalc = () => {
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`return (${calcExpr || 0})`)();
      setCalcExpr(String(result));
    } catch {
      // ignore
    }
  };

  const handleUseCalc = () => {
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`return (${calcExpr || 0})`)();
      handleChange('amount', parseFloat(result));
    } catch {
      // ignore
    }
    setCalculatorOpen(false);
    setCalcExpr('');
  };

  const handleFeedback = (field: keyof Transaction, positive: boolean) => {
    addSuggestionsFeedbackEntry({
      field,
      positive,
      value: (editedTransaction as any)[field],
      timestamp: new Date().toISOString(),
    });
    setFeedbackGiven(prev => ({ ...prev, [field]: true }));
  };

  const renderFeedbackIcons = (field: keyof Transaction) => {
    if (!showFeedback || !isDriven(field, drivenFields) || feedbackGiven[field]) {
      return null;
    }
    return (
      <span className="ml-1 flex items-center gap-1">
        <ThumbsUp
          className="size-4 cursor-pointer text-success hover:text-success/80"
          onClick={() => handleFeedback(field, true)}
        />
        <ThumbsDown
          className="size-4 cursor-pointer text-destructive hover:text-destructive/80"
          onClick={() => handleFeedback(field, false)}
        />
      </span>
    );
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
    setShowFeedback(true);
  };


  const rowClass = cn('flex items-center', compact ? 'gap-1' : 'gap-2');
  const labelClass = cn(
    compact ? 'w-24 md:w-28' : 'w-32',
    'text-sm font-semibold text-foreground'
  );
  const inputPadding = compact ? 'py-1 px-2' : 'py-2 px-3';
  const darkFieldClass =
    'bg-background text-foreground border-border placeholder:text-muted-foreground';
  const formClass = cn(
    'bg-card p-4 rounded-md shadow-sm',
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
              'rounded-md border-border focus:ring-ring',
              darkFieldClass
            )}
            isAutoFilled={isDriven('type', drivenFields)}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
        </Select>
        {renderFeedbackIcons('type')}
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Title*</label>

        <Input
          value={editedTransaction.title || ''}
          onChange={(e) => {
            setTitleManuallyEdited(true);
            handleChange('title', e.target.value);
          }}
          isAutoFilled={isDriven('title', drivenFields)}
          placeholder="Transaction title"
          required
          className={cn(
            'w-full text-sm',
            inputPadding,
            'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            darkFieldClass
          )}
        />
        {renderFeedbackIcons('title')}
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Currency*</label>

        <div className="flex w-full items-center gap-1">
          <Select
            value={editedTransaction.currency || 'SAR'}
            onValueChange={(value) => handleChange('currency', value)}
          >
          <SelectTrigger
            className={cn(
              'w-full text-sm',
              inputPadding,
              'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
              darkFieldClass,
              hasLowConfidence('currency', fieldConfidences) && 'border-warning'
            )}
            isAutoFilled={isDriven('currency', drivenFields)}
            title={hasLowConfidence('currency', fieldConfidences) ? 'Low confidence' : undefined}
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
        {renderFeedbackIcons('currency')}
      </div>
      </div>

      <Dialog open={addCurrencyOpen} onOpenChange={setAddCurrencyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Currency</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Short Name*</label>
              <Input
                value={newCurrency.code}
                onChange={e => setNewCurrency(prev => ({ ...prev, code: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Country*</label>
              <Input
                value={newCurrency.country}
                onChange={e => setNewCurrency(prev => ({ ...prev, country: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Conversion Rate</label>
              <Input
                type="number"
                step="0.0001"
                value={newCurrency.rate}
                onChange={e => setNewCurrency(prev => ({ ...prev, rate: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddCurrencyOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveCurrency}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Name*</label>
              <Input
                value={newAccount.name}
                onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">IBAN</label>
              <Input
                value={newAccount.iban}
                onChange={e => setNewAccount(prev => ({ ...prev, iban: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddAccountOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveAccount}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Type*</label>
              <Select
                value={newCategory.type}
                onValueChange={(val) =>
                  setNewCategory((prev) => ({ ...prev, type: val as TransactionType }))
                }
              >
                <SelectTrigger className={cn('w-full', darkFieldClass)}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Category*</label>
              <Input
                value={newCategory.category}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, category: e.target.value }))
                }
                className={darkFieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Subcategory</label>
              <Input
                value={newCategory.subcategory}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, subcategory: e.target.value }))
                }
                className={darkFieldClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveCategory}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Name*</label>
              <Input
                value={newPerson.name}
                onChange={e => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Relation</label>
              <Input
                value={newPerson.relation}
                onChange={e => setNewPerson(prev => ({ ...prev, relation: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddPersonOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSavePerson}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Vendor Name*</label>
              <Input
                value={newVendor.name}
                onChange={e => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Type*</label>
              <Select value={newVendor.type} onValueChange={val => setNewVendor(prev => ({ ...prev, type: val as TransactionType }))}>
                <SelectTrigger className={cn('w-full', darkFieldClass)}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Category*</label>
              <Input
                value={newVendor.category}
                onChange={e => setNewVendor(prev => ({ ...prev, category: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-white">Subcategory</label>
              <Input
                value={newVendor.subcategory}
                onChange={e => setNewVendor(prev => ({ ...prev, subcategory: e.target.value }))}
                className={darkFieldClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddVendorOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveVendor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Calculator</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input readOnly value={calcExpr} className={darkFieldClass} />
            <div className="grid grid-cols-4 gap-2 text-sm">
              {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','C','+'].map(ch => (
                <Button key={ch} type="button" variant="secondary" size="sm" onClick={() => {
                  if (ch === 'C') return clearCalc();
                  handleCalcInput(ch);
                }}>
                  {ch}
                </Button>
              ))}
              <Button type="button" variant="default" className="col-span-4" onClick={evaluateCalc}>=</Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCalculatorOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleUseCalc}>Use</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className={rowClass}>
        <label className={labelClass}>Amount*</label>

        <div className="flex w-full items-center gap-1">
            <Input
              type="number"
              step="0.01"
              value={editedTransaction.amount}
              isAutoFilled={isDriven('amount', drivenFields)}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
            placeholder="0.00"
            required
            title={hasLowConfidence('amount', fieldConfidences) ? 'Low confidence' : undefined}
          className={cn(
            'w-full text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            inputPadding
          ,
            darkFieldClass,
            hasLowConfidence('amount', fieldConfidences) && 'border-amber-500'
          )}
        />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setCalculatorOpen(true)}
          >
          <Calculator className="size-4" />
        </Button>
        {renderFeedbackIcons('amount')}
        </div>
      </div>


      <div className={rowClass}>
        <label className={labelClass}>From Account*</label>

        <div className="flex w-full items-center gap-1">
            <Input
              list="accounts-list"
              value={editedTransaction.fromAccount || ''}
              onChange={(e) => handleChange('fromAccount', e.target.value)}
              isAutoFilled={isDriven('fromAccount', drivenFields)}
            title={hasLowConfidence('fromAccount', fieldConfidences) ? 'Low confidence' : undefined}
            placeholder="Source account"
            required
            className={cn(
              'w-full text-sm',
              inputPadding,
              'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
              darkFieldClass,
              hasLowConfidence('fromAccount', fieldConfidences) && 'border-amber-500'
            )}
          />
          <Button type="button" variant="outline" size="icon" onClick={() => setAddAccountOpen(true)}>
            <Plus className="size-4" />
          </Button>
          <datalist id="accounts-list">
            {accounts.map(acc => (
              <option key={acc.name} value={acc.name} />
            ))}
          </datalist>
          {renderFeedbackIcons('fromAccount')}
        </div>
      </div>

      {editedTransaction.type === 'transfer' && (
        <div className={rowClass}>
          <label className={labelClass}>To Account*</label>

          <div className="flex w-full items-center gap-1">
            <Input
              list="accounts-list"
              value={editedTransaction.toAccount || ''}
              onChange={(e) => handleChange('toAccount', e.target.value)}
              isAutoFilled={isDriven('toAccount', drivenFields)}
              placeholder="Destination account"
              required
              className={cn(
                'w-full text-sm',
                inputPadding,
                'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                darkFieldClass
              )}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => setAddAccountOpen(true)}>
              <Plus className="size-4" />
            </Button>
            {renderFeedbackIcons('toAccount')}
          </div>
        </div>
      )}


      <div className={rowClass}>
        <label className={labelClass}>Category*</label>

        <div className="flex w-full items-center gap-1">
          <Select
            value={editedTransaction.category || ''}
            onValueChange={(value) => handleChange('category', value)}
          >
            <SelectTrigger
              className={cn(
                'w-full text-sm',
                inputPadding,
                'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                darkFieldClass,
                hasLowConfidence('category', fieldConfidences) && 'border-amber-500'
              )}
              isAutoFilled={isDriven('category', drivenFields)}
              title={hasLowConfidence('category', fieldConfidences) ? 'Low confidence' : undefined}
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setNewCategory({ type: editedTransaction.type, category: '', subcategory: '' });
              setAddCategoryOpen(true);
            }}
          >
            <Plus className="size-4" />
          </Button>
          {renderFeedbackIcons('category')}
        </div>
      </div>

      <div className={rowClass}>
        <label className={labelClass}>Subcategory</label>

        <div className="flex w-full items-center gap-1">
          {availableSubcategories.length > 0 ? (
            <>
              <Select
                value={editedTransaction.subcategory || 'none'}
                onValueChange={(value) => handleChange('subcategory', value)}
              >
                <SelectTrigger
                  className={cn(
                    'w-full text-sm',
                    inputPadding,
                    'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                    darkFieldClass,
                    hasLowConfidence('subcategory', fieldConfidences) && 'border-amber-500'
                  )}
                  isAutoFilled={isDriven('subcategory', drivenFields)}
                  title={hasLowConfidence('subcategory', fieldConfidences) ? 'Low confidence' : undefined}
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
              {renderFeedbackIcons('subcategory')}
            </>
          ) : (
            <div className={cn('flex-1 text-sm text-muted-foreground', inputPadding)}>N/A</div>
          )}
        </div>
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Person (Optional)</label>

        <div className="flex w-full items-center gap-1">
          <Select
            value={editedTransaction.person || 'none'}
            onValueChange={(value) => handleChange('person', value)}
          >
            <SelectTrigger
              className={cn(
                'w-full text-sm',
                inputPadding,
                'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                darkFieldClass
              )}
            >
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {people.map((person) => (
                <SelectItem key={person} value={person}>
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={() => setAddPersonOpen(true)}>
            <Plus className="size-4" />
          </Button>
          {renderFeedbackIcons('person')}
        </div>
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Vendor</label>

        <div className="flex w-full items-center gap-1">
          <Input
            list="vendors-list"
            value={editedTransaction.vendor || ''}
            isAutoFilled={isDriven('vendor', drivenFields)}
            onChange={(e) => handleChange('vendor', e.target.value)}
            placeholder="e.g., Netflix"
            title={hasLowConfidence('vendor', fieldConfidences) ? 'Low confidence' : undefined}
            className={cn(
              'w-full text-sm',
              inputPadding,
              'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
              darkFieldClass,
              hasLowConfidence('vendor', fieldConfidences) && 'border-amber-500'
            )}
          />
          <Button type="button" variant="outline" size="icon" onClick={() => setAddVendorOpen(true)}>
            <Plus className="size-4" />
          </Button>
          <datalist id="vendors-list">
            {vendors.map(v => (
              <option key={v} value={v} />
            ))}
          </datalist>
          {renderFeedbackIcons('vendor')}
        </div>
      </div>


      <div className={rowClass}>
        <label className={labelClass}>Date*</label>

        <Input
          type="date"
          value={editedTransaction.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          isAutoFilled={isDriven('date', drivenFields)}
          title={hasLowConfidence('date', fieldConfidences) ? 'Low confidence' : undefined}
          required
          className={cn(
            'w-full text-sm',
            inputPadding,
            'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            darkFieldClass,
            hasLowConfidence('date', fieldConfidences) && 'border-amber-500'
          )}
        />
        {renderFeedbackIcons('date')}
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
          isAutoFilled={isDriven('description', drivenFields)}
          className={cn(
            'w-full text-sm',
            inputPadding,
            'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            darkFieldClass
          )}
        />
        {renderFeedbackIcons('description')}
      </div>


      {showNotes && (
        <div className={rowClass}>
          <label className={labelClass}>Notes (Optional)</label>

          <Textarea
            value={editedTransaction.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            isAutoFilled={isDriven('notes', drivenFields)}
            className={cn(
              'w-full text-sm',
              inputPadding,
              'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
              darkFieldClass
            )}
          />
          {renderFeedbackIcons('notes')}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          className={cn(
            'bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md',
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
