import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getCategoryHierarchy } from '@/lib/categories-data';
import { extractTemplateStructure } from '@/lib/smart-paste-engine/templateUtils';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { saveTransactionWithLearning } from '@/lib/smart-paste-engine/saveTransactionWithLearning';
import { generateDefaultTitle } from '@/components/TransactionEditForm';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';
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

const ReviewDraftTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<DraftTransaction[]>([]);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
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
      });
    });

    toast({
      title: 'Saved',
      description: `${validTransactions.length} transaction(s) saved successfully.`,
    });

    setTransactions([]);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Review SMS Transactions</h1>
        </div>
      </div>

      {transactions.map((txn, index) => (
        <Card key={index} className="p-[var(--card-padding)] mb-4">
          <p className="mb-2 text-sm text-gray-500">{txn.rawMessage}</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={txn.vendor} onChange={e => handleFieldChange(index, 'vendor', e.target.value)} className="border rounded p-2" />
            <input value={txn.title} readOnly className="border rounded p-2 text-gray-600 bg-gray-50" />
            <input value={txn.amount || ''} onChange={e => handleFieldChange(index, 'amount', e.target.value)} className="border rounded p-2" />
            <input value={txn.currency || ''} onChange={e => handleFieldChange(index, 'currency', e.target.value)} className="border rounded p-2" />
            <input type="date" value={txn.date?.split('T')[0] || ''} onChange={e => handleFieldChange(index, 'date', e.target.value)} className="border rounded p-2" />
            <select value={txn.category} onChange={e => handleFieldChange(index, 'category', e.target.value)} className="border rounded p-2">
              {getCategoryHierarchy().filter(c => c.type === txn.type).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select value={txn.subcategory} onChange={e => handleFieldChange(index, 'subcategory', e.target.value)} className="border rounded p-2">
              {(getCategoryHierarchy().find(
					c => c.name === txn.category && c.type === txn.type
				  )?.subcategories || []).map(sub => (
					<option key={sub.id} value={sub.name}>
					  {sub.name}
					</option>
				  ))}
            </select>
            <input value={txn.fromAccount || ''} onChange={e => handleFieldChange(index, 'fromAccount', e.target.value)} className="border rounded p-2" />
            <select value={txn.type} onChange={e => handleFieldChange(index, 'type', e.target.value)} className="border rounded p-2">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </Card>
      ))}

      <Button className="w-full mt-4" onClick={handleSave}>
        Save All
      </Button>
    </Layout>
  );
};

export default ReviewDraftTransactions;
