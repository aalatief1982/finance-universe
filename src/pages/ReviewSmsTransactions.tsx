import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getCategoryHierarchy } from '@/lib/categories-data';
import { extractTemplateStructure } from '@/lib/smart-paste-engine/templateUtils';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { saveTransactionWithLearning } from '@/lib/smart-paste-engine/saveTransactionWithLearning';
import { generateDefaultTitle } from '@/components/TransactionEditForm';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import { getCategoriesForType, getSubcategoriesForCategory} from '@/lib/categories-data';
import { useTransactions } from '@/context/TransactionContext';

interface DraftTransaction {
  id?: string;
  vendor: string;
  title: string;
  category: string;
  subcategory: string;
  amount?: string;
  currency?: string;
  date?: string;
  fromAccount?: string;
  type?: string;
  rawMessage: string;
}

const ReviewSmsTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<DraftTransaction[]>([]);
  const { toast } = useToast();
  const location = useLocation();
  const { addTransaction, updateTransaction } = useTransactions();

  const messages: any[] = location.state?.messages || [];
  const vendorMap: Record<string, string> = location.state?.vendorMap || {};
  const keywordMap: any[] = location.state?.keywordMap || [];

  useEffect(() => {
    const parsed = messages.map((msg) => {
      const rawMessage = msg.message || msg.rawMessage || '';
      const result = parseAndInferTransaction(rawMessage, msg.sender);
      const txn = result.transaction;

      // Apply manual overrides from vendor map and keyword bank
      const mappedVendor = vendorMap[txn.vendor] || txn.vendor;
      const kbEntry = keywordMap.find(kb => kb.keyword === mappedVendor);
      const cat = kbEntry?.mappings.find(m => m.field === 'category')?.value || txn.category;
      const sub = kbEntry?.mappings.find(m => m.field === 'subcategory')?.value || txn.subcategory;

      return {
        ...txn,
        vendor: mappedVendor,
        category: cat,
        subcategory: sub,
        rawMessage,
        title: generateDefaultTitle({ ...txn, category: cat, subcategory: sub })
      };
    });

    setTransactions(parsed);
  }, []	);

/*   const handleFieldChange = (index: number, field: keyof DraftTransaction, value: string) => {
    const updated = [...transactions];
    updated[index][field] = value;

    if (['amount', 'currency', 'subcategory'].includes(field)) {
      updated[index].title = generateDefaultTitle(updated[index]);
    }

    setTransactions(updated);
  }; */
const handleFieldChange = (index: number, field: keyof DraftTransaction, value: string) => {
  const updated = [...transactions];
  const txn = { ...updated[index], [field]: value };

		if (field === 'type') {
		  const validCategories = getCategoriesForType(value as TransactionType);  // ⬅️ Already names!
		  console.log('[TYPE CHANGE] Valid Categories:', validCategories);

		  txn.category = validCategories[0] || 'Uncategorized';
		  console.log('[TYPE CHANGE] Selected Category:', txn.category);

		  const validSubcategories = getSubcategoriesForCategory(txn.category).map(sc => sc.name);
		  console.log('[TYPE CHANGE] Valid Subcategories for Category:', txn.category, validSubcategories);

		  txn.subcategory = validSubcategories[0] || 'none';
		  console.log('[TYPE CHANGE] Selected Subcategory:', txn.subcategory);
		}


  if (field === 'category') {
    const validSubcategories = getSubcategoriesForCategory(value as string).map(sc => sc.name);
    txn.subcategory = validSubcategories[0] || 'none';
  }

  if (['amount', 'currency', 'subcategory', 'category'].includes(field)) {
    txn.title = generateDefaultTitle(txn);
  }

  updated[index] = txn;
  setTransactions(updated);
};

  const handleSave = () => {
    const validTransactions: DraftTransaction[] = [];
    const skippedTransactions: DraftTransaction[] = [];

    transactions.forEach((txn) => {
      const title = generateDefaultTitle(txn);
      if (txn.amount && txn.currency && txn.date && txn.category && txn.subcategory && title) {
        validTransactions.push({ ...txn, title });
      } else {
        skippedTransactions.push(txn);
      }
    });

    if (skippedTransactions.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Some transactions skipped',
        description: `${skippedTransactions.length} incomplete transaction(s) were not saved.`,
      });
    }

    if (validTransactions.length === 0) return;

    validTransactions.forEach(txn => {
      const normalizedAmount =
        txn.type === 'expense' ? -Math.abs(parseFloat(txn.amount!)) : Math.abs(parseFloat(txn.amount!));

      const cleanTransaction = {
        ...txn,
        amount: normalizedAmount,
        title: txn.title,
      };

      saveTransactionWithLearning(cleanTransaction as any, {
        rawMessage: txn.rawMessage,
        senderHint: txn.fromAccount || '',
        isNew: true,
        addTransaction,
        updateTransaction,
        learnFromTransaction: () => {},
        navigateBack: () => {},
        silent: true,
      });
    });

    toast({
      title: 'Saved',
      description: `${validTransactions.length} transaction(s) saved successfully.`,
    });

    setTransactions([]);
  };

  return (
    <Layout showBack>
      <PageHeader title="Review Details" showBack />
      <div className="flex justify-end mb-4">
        <Button onClick={handleSave}>Save All</Button>
      </div>

      {transactions.map((txn, index) => (
        <Card key={index} className="p-[var(--card-padding)] mb-4">
          <p className="mb-2 text-sm text-gray-500">{txn.rawMessage}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={txn.vendor}
              onChange={e => handleFieldChange(index, 'vendor', e.target.value)}
              className="p-2 dark:bg-white dark:text-black"
            />
            <Input
              value={txn.title}
              readOnly
              className="p-2 text-gray-600 bg-gray-50 dark:bg-white dark:text-black"
            />
            <Input
              value={txn.amount || ''}
              onChange={e => handleFieldChange(index, 'amount', e.target.value)}
              className="p-2 dark:bg-white dark:text-black"
            />
            <Input
              value={txn.currency || ''}
              onChange={e => handleFieldChange(index, 'currency', e.target.value)}
              className="p-2 dark:bg-white dark:text-black"
            />
            <Input
              type="date"
              value={txn.date?.split('T')[0] || ''}
              onChange={e => handleFieldChange(index, 'date', e.target.value)}
              className="p-2 dark:bg-white dark:text-black"
            />
            <Select
              value={txn.category}
              onValueChange={value => handleFieldChange(index, 'category', value)}
            >
              <SelectTrigger className="p-2 dark:bg-white dark:text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCategoryHierarchy().filter(c => c.type === txn.type).map(c => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={txn.subcategory}
              onValueChange={value => handleFieldChange(index, 'subcategory', value)}
            >
              <SelectTrigger className="p-2 dark:bg-white dark:text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(getCategoryHierarchy().find(
                  c => c.name === txn.category && c.type === txn.type
                )?.subcategories || []).map(sub => (
                  <SelectItem key={sub.id} value={sub.name}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={txn.fromAccount || ''}
              onChange={e => handleFieldChange(index, 'fromAccount', e.target.value)}
              className="p-2 dark:bg-white dark:text-black"
            />
            <Select value={txn.type} onValueChange={value => handleFieldChange(index, 'type', value)}>
              <SelectTrigger className="p-2 dark:bg-white dark:text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      ))}

      <Button className="w-full mt-4" onClick={handleSave}>
        Save All
      </Button>
    </Layout>
  );
};

export default ReviewSmsTransactions;
