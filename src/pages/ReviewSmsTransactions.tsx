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
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { saveTransactionWithLearning } from '@/lib/smart-paste-engine/saveTransactionWithLearning';
import { generateDefaultTitle } from '@/components/TransactionEditForm';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNavigate } from 'react-router-dom';
import { setLastSmsImportDate, updateSmsSenderImportDates } from '@/utils/storage-utils';
import { getCategoriesForType, getSubcategoriesForCategory} from '@/lib/categories-data';
import { TransactionType } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  confidence: number;
}

const ReviewSmsTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<DraftTransaction[]>([]);
  const { toast } = useToast();
  const location = useLocation();
  const { addTransaction, updateTransaction } = useTransactions();

  const messages: any[] = location.state?.messages || [];
  const vendorMap: Record<string, string> = location.state?.vendorMap || {};
  const keywordMap: any[] = location.state?.keywordMap || [];

  const allHighConfidence =
    transactions.length > 0 && transactions.every(t => t.confidence >= 0.9);

  useEffect(() => {
    const parseAll = async () => {
      const parsed = await Promise.all(
        messages.map(async (msg) => {
          const rawMessage = msg.message || msg.rawMessage || "";
          const result = await parseAndInferTransaction(rawMessage, msg.sender);
          const txn = result.transaction;

          const mappedVendor = vendorMap[txn.vendor] || txn.vendor;
          const kbEntry = keywordMap.find(kb => kb.keyword === mappedVendor);
          const cat = kbEntry?.mappings.find(m => m.field === "category")?.value || txn.category;
          const sub = kbEntry?.mappings.find(m => m.field === "subcategory")?.value || txn.subcategory;

          return {
            ...txn,
            vendor: mappedVendor,
            category: cat,
            subcategory: sub,
            rawMessage,
            confidence: result.confidence,
            title: generateDefaultTitle({ ...txn, category: cat, subcategory: sub })
          };
        })
      );

      setTransactions(parsed);
    };

    parseAll();
  }, [] );


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
    const valid: Array<{ txn: DraftTransaction; idx: number }> = [];
    const skippedTransactions: DraftTransaction[] = [];

    transactions.forEach((txn, idx) => {
      const title = generateDefaultTitle(txn);
      if (txn.amount && txn.currency && txn.date && txn.category && txn.subcategory && title) {
        valid.push({ txn: { ...txn, title }, idx });
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

    if (valid.length === 0) return;

    valid.forEach(({ txn }) => {
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

    const senderDates: Record<string, string> = {};
    valid.forEach(({ idx }) => {
      const msg = messages[idx];
      if (msg?.sender) {
        const existing = senderDates[msg.sender];
        if (!existing || new Date(msg.date).getTime() > new Date(existing).getTime()) {
          senderDates[msg.sender] = msg.date;
        }
      }
    });
    updateSmsSenderImportDates(senderDates);

    toast({
      title: 'Saved',
      description: `${valid.length} transaction(s) saved successfully.`,
    });

    setLastSmsImportDate(new Date().toISOString());

    setTransactions([]);
  };

  const navigate = useNavigate();

  return (
    <Layout showBack>
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
              className="p-2 dark:bg-black dark:text-white dark:border-zinc-700"
            />
            <Input
              value={txn.title}
              readOnly
              className="p-2 text-gray-600 bg-gray-50 dark:bg-black dark:text-white dark:border-zinc-700"
            />
            <Input
              value={txn.amount || ''}
              onChange={e => handleFieldChange(index, 'amount', e.target.value)}
              className="p-2 dark:bg-black dark:text-white dark:border-zinc-700"
            />
            <Input
              value={txn.currency || ''}
              onChange={e => handleFieldChange(index, 'currency', e.target.value)}
              className="p-2 dark:bg-black dark:text-white dark:border-zinc-700"
            />
            <Input
              type="date"
              value={txn.date?.split('T')[0] || ''}
              onChange={e => handleFieldChange(index, 'date', e.target.value)}
              className="p-2 dark:bg-black dark:text-white dark:border-zinc-700"
            />
            <Select
              value={txn.category}
              onValueChange={value => handleFieldChange(index, 'category', value)}
            >
              <SelectTrigger className="p-2 dark:bg-black dark:text-white dark:border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCategoryHierarchy()
                  .filter(c => c.type === txn.type)
                  .map(c => (
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
              <SelectTrigger className="p-2 dark:bg-black dark:text-white dark:border-zinc-700">
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
              className="p-2 dark:bg-black dark:text-white dark:border-zinc-700"
            />
            <ToggleGroup
              type="single"
              value={txn.type}
              onValueChange={val =>
                val && handleFieldChange(index, 'type', val)
              }
              className="flex justify-start"
            >
              <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
              <ToggleGroupItem value="income">Income</ToggleGroupItem>
              <ToggleGroupItem value="transfer">Transfer</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate('/edit-transaction', {
                  state: { transaction: txn, rawMessage: txn.rawMessage },
                })
              }
            >
              Full Form
            </Button>
          </div>
        </Card>
      ))}

      {allHighConfidence && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full mt-4">Confirm All</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Confirm {transactions.length} Transactions
              </AlertDialogTitle>
              <AlertDialogDescription>
                <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto mt-2">
                  {transactions.map((t, i) => (
                    <li key={i}>
                      {(t.title || t.vendor) + ' - ' + (t.amount || '') + ' ' + (t.currency || '')}
                    </li>
                  ))}
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSave}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Button className="w-full mt-4" onClick={handleSave}>
        Save All
      </Button>
    </Layout>
  );
};

export default ReviewSmsTransactions;
