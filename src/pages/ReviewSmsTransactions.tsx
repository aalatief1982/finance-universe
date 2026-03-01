/**
 * @file ReviewSmsTransactions.tsx
 * @description Review UI for SMS-imported transactions with smart-paste
 *              parsing, confidence display, and bulk save.
 *
 * @module pages/ReviewSmsTransactions
 *
 * @responsibilities
 * 1. Parse SMS messages into draft transactions with confidence scores
 * 2. Allow user edits, category overrides, and skip decisions
 * 3. Persist transactions and optional learning mappings
 *
 * @dependencies
 * - parseAndInferTransaction: SMS parsing + confidence scoring
 * - saveTransactionWithLearning: persistence + learning
 * - senderCategoryRules: optional "always apply" rules
 *
 * @review-tags
 * - @risk: date input parsing and ISO conversion
 * - @side-effects: writes transactions and learning stores
 *
 * @review-checklist
 * - [ ] Low-confidence transactions are surfaced for review
 * - [ ] "Always apply" rules stored with sender context
 * - [ ] Skipped messages do not persist or learn
 */

import React, { useEffect, useState } from 'react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { normalizeInferenceDTO, type InferenceDTO } from '@/lib/inference/inferenceDTO';
import { saveTransactionWithLearning } from '@/lib/smart-paste-engine/saveTransactionWithLearning';
import { generateDefaultTitle } from '@/components/transaction-utils';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { updateSmsSenderImportDates } from '@/utils/storage-utils';
import { learnVendorCategoryRule } from '@/lib/smart-paste-engine/senderCategoryRules';
import { getCategoriesForType, getSubcategoriesForCategory} from '@/lib/categories-data';
import { TransactionType, Transaction } from '@/types/transaction';
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
import type { AccountCandidate } from '@/lib/smart-paste-engine/accountCandidates';

interface DraftTransaction {
  id?: string;
  vendor: string;
  title: string;
  category: string;
  subcategory: string;
  amount?: string | number;
  currency?: string;
  date?: string;
  fromAccount?: string;
  toAccount?: string;
  type?: string;
  rawMessage: string;
  sender?: string;
  alwaysApply?: boolean;

  source?: string;

  skipped?: boolean;


  confidence?: number;
  fieldConfidences?: Record<string, number>;
  parsingStatus?: 'success' | 'partial' | 'failed';
  inferenceDTO?: InferenceDTO;
  accountCandidates?: AccountCandidate[];

}

interface SmsMessage {
  id?: string;
  message?: string;
  rawMessage?: string;
  body?: string;
  sender: string;
  date?: string;
}

interface SmsLocationState {
  messages?: SmsMessage[];
  vendorMap?: Record<string, string>;
  keywordMap?: Array<{ keyword: string; mappings: Array<{ field: string; value: string }> }>;
}

const ReviewSmsTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<DraftTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const { addTransaction, updateTransaction } = useTransactions();

  const state = location.state as SmsLocationState | null;
  const historyState = (window.history.state?.usr || window.history.state) as SmsLocationState | undefined;
  const effectiveState = state || historyState || null;
  const messages = React.useMemo(() => effectiveState?.messages || [], [effectiveState]);
  const vendorMap = React.useMemo(() => effectiveState?.vendorMap || {}, [effectiveState]);
  const keywordMap = React.useMemo(() => effectiveState?.keywordMap || [], [effectiveState]);

  const allHighConfidence =
    transactions.length > 0 && transactions.every(t => t.confidence >= 0.9);

  useEffect(() => {
    const parseAll = async () => {
      const parsed = await Promise.all(
        messages.map(async (msg) => {
          const rawMessage = msg.message || msg.rawMessage || "";
          const result = await parseAndInferTransaction(
            rawMessage,
            msg.sender,
            msg.id
          );
          const { transaction: txn, confidence, fieldConfidences, parsingStatus } = result;
          const normalizedTransaction = {
            ...txn,
            toAccount:
              txn.type === 'income' && !txn.toAccount && txn.fromAccount
                ? txn.fromAccount
                : txn.toAccount,
            fromAccount: txn.type === 'income' ? undefined : txn.fromAccount,
          };
          const mappedVendor = vendorMap[txn.vendor] || txn.vendor;
          const matchingKeywordMappings = keywordMap
            .filter(kb => kb.keyword === mappedVendor)
            .flatMap(kb => kb.mappings);

          const mappingOverrides = matchingKeywordMappings.reduce<{
            category?: string;
            subcategory?: string;
          }>((acc, mapping) => {
            if (mapping.field === 'category' && mapping.value) {
              acc.category = mapping.value;
            }
            if (mapping.field === 'subcategory' && mapping.value) {
              acc.subcategory = mapping.value;
            }
            return acc;
          }, {});

          // Override policy: directFields > templateFields > mappingOverrides > keywordInference > defaults.
          // parseAndInferTransaction output is the authoritative baseline; mapping only overrides vendor/category/subcategory.
          const finalTransaction = {
            ...normalizedTransaction,
            vendor: mappedVendor,
            category: mappingOverrides.category || txn.category,
            subcategory: mappingOverrides.subcategory || txn.subcategory,
          };

          const inferenceDTO = normalizeInferenceDTO({
            transaction: finalTransaction,
            rawMessage,
            senderHint: msg.sender,
            confidence,
            fieldConfidences,
            parsingStatus,
            origin: result.origin,
            matchOrigin: result.origin,
            matchedCount: result.matchedCount,
            totalTemplates: result.totalTemplates,
            fieldScore: result.fieldScore,
            keywordScore: result.keywordScore,
            isSuggested: true,
            mode: 'create',
          });

          return {
            ...finalTransaction,
            rawMessage,
            title: generateDefaultTitle(finalTransaction),
            sender: msg.sender,
            alwaysApply: false,
            confidence,
            fieldConfidences,
            parsingStatus,
            inferenceDTO,
            accountCandidates: result.parsed?.candidates?.accountCandidates || [],
          };
        })
      );

      setTransactions(parsed as unknown as DraftTransaction[]);
    };
    setLoading(true);
    parseAll()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [messages, vendorMap, keywordMap] );


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
		  if (import.meta.env.MODE === 'development') {
		    // console.log('[TYPE CHANGE] Valid Categories:', validCategories);
		  }

		  txn.category = validCategories[0] || 'Uncategorized';
		  if (import.meta.env.MODE === 'development') {
		    // console.log('[TYPE CHANGE] Selected Category:', txn.category);
		  }

                  const validSubcategories = getSubcategoriesForCategory(txn.category);
		  if (import.meta.env.MODE === 'development') {
		    // console.log('[TYPE CHANGE] Valid Subcategories for Category:', txn.category, validSubcategories);
		  }

		  txn.subcategory = validSubcategories[0] || 'none';
		  if (import.meta.env.MODE === 'development') {
		    // console.log('[TYPE CHANGE] Selected Subcategory:', txn.subcategory);
		  }

      if (value === 'income' && txn.fromAccount && !txn.toAccount) {
        txn.toAccount = txn.fromAccount;
        txn.fromAccount = '';
      }
		}


  if (field === 'category') {
    const validSubcategories = getSubcategoriesForCategory(value as string);
    txn.subcategory = validSubcategories[0] || 'none';
  }

  if (['amount', 'currency', 'subcategory', 'category'].includes(field)) {
    // Convert DraftTransaction to Transaction for title generation
    const transactionForTitle: Transaction = {
      id: txn.id || `temp-${Date.now()}`,
      title: txn.title,
      amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : (txn.amount || 0),
      category: txn.category,
      subcategory: txn.subcategory,
      date: txn.date || new Date().toISOString().split('T')[0],
      type: (txn.type as TransactionType) || 'expense',
      source: 'sms-import',
      currency: txn.currency,
      vendor: txn.vendor,
      fromAccount: txn.fromAccount,
      toAccount: txn.toAccount
    };
    txn.title = generateDefaultTitle(transactionForTitle);
  }

  updated[index] = txn;
  setTransactions(updated);
};

const handleAlwaysApplyChange = (index: number, checked: boolean) => {
  const updated = [...transactions];
  updated[index].alwaysApply = checked;
  setTransactions(updated);

  if (checked) {
    const msg = messages[index];
    if (msg?.sender) {
      learnVendorCategoryRule(msg.sender, updated[index].category, updated[index].subcategory);
    }
  }
};

const toggleSkip = (index: number) => {
  setTransactions(prev => {
    const updated = [...prev];
    updated[index].skipped = !updated[index].skipped;
    return updated;
  });
};

const toggleSkipAll = () => {
  const allSkipped = transactions.every(t => t.skipped);
  setTransactions(prev => prev.map(t => ({ ...t, skipped: !allSkipped })));
};

  const handleSave = () => {
    const valid: Array<{ txn: Transaction; idx: number }> = [];
    const incomplete: DraftTransaction[] = [];
    const skippedTxns: DraftTransaction[] = [];

    transactions.forEach((txn, idx) => {
      if (txn.skipped) {
        skippedTxns.push(txn);
        return;
      }

      // Convert DraftTransaction to Transaction for title generation
      const transactionForTitle: Transaction = {
        id: txn.id || `temp-${Date.now()}`,
        title: txn.title,
        amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : (txn.amount || 0),
        category: txn.category,
        subcategory: txn.subcategory,
        date: txn.date || new Date().toISOString().split('T')[0],
        type: (txn.type as TransactionType) || 'expense',
        source: 'sms-import',
        currency: txn.currency,
        vendor: txn.vendor,
        fromAccount: txn.fromAccount,
        toAccount: txn.toAccount
      };
      const title = generateDefaultTitle(transactionForTitle);
      
      if (txn.amount && txn.currency && txn.date && txn.category && txn.subcategory && title) {
        const fullTransaction: Transaction = {
          id: txn.id || `txn-${Date.now()}-${Math.random()}`,
          title,
          amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : txn.amount,
          category: txn.category,
          subcategory: txn.subcategory,
          date: txn.date,
          type: (txn.type as TransactionType) || 'expense',
          source: 'sms-import',
          currency: txn.currency,
          vendor: txn.vendor,
          fromAccount: txn.fromAccount,
          toAccount: txn.toAccount,
          details: {
            sms: txn.sender ? {
              sender: txn.sender,
              message: txn.rawMessage,
              timestamp: new Date().toISOString()
            } : undefined,
            rawMessage: txn.rawMessage
          }
        };
        valid.push({ txn: fullTransaction, idx });
      } else {
        incomplete.push(txn);
      }
    });

    if (incomplete.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Some transactions skipped',
        description: `${incomplete.length} incomplete transaction(s) were not saved.`,
      });
    }

    if (valid.length === 0 && skippedTxns.length === 0) return;

    valid.forEach(({ txn, idx }) => {
      const originalTxn = transactions[idx];
      saveTransactionWithLearning(txn, {
        rawMessage: originalTxn.rawMessage,
        senderHint: txn.fromAccount || txn.toAccount || '',
        isNew: true,
        addTransaction,
        updateTransaction,
        learnFromTransaction: () => {},
        navigateBack: () => {},
        silent: true,
      });

      if (originalTxn.alwaysApply && originalTxn.sender) {
        learnVendorCategoryRule(originalTxn.sender, txn.category, txn.subcategory);
      }
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
    skippedTxns.forEach(txn => {
      if (txn.sender && txn.date) {
        const existing = senderDates[txn.sender];
        if (!existing || new Date(txn.date).getTime() > new Date(existing).getTime()) {
          senderDates[txn.sender] = txn.date;
        }
      }
    });
    updateSmsSenderImportDates(senderDates);

    toast({
      title: 'Saved',
      description: `${valid.length} transaction(s) saved, ${skippedTxns.length} skipped.`,
    });

    setTransactions([]);

    if (valid.length === 0 && skippedTxns.length > 0) {
      navigate('/');
    }
  };

  const navigate = useNavigate();

  return (
    <>
      <LoadingOverlay isOpen={loading} message="Parsing messages..." />
      <Layout showBack>
        <div className="flex justify-end mb-4 gap-2">
          <Button variant="outline" onClick={toggleSkipAll}>
            {transactions.every(t => t.skipped) ? 'Unskip All' : 'Skip All'}
          </Button>
          <Button onClick={handleSave}>Save All</Button>
        </div>

      {transactions.map((txn, index) => {
        const accountFieldName = txn.type === 'income' ? 'toAccount' : 'fromAccount';
        const accountValue = txn.type === 'income' ? txn.toAccount || '' : txn.fromAccount || '';
        const accountConfidence =
          txn.type === 'income'
            ? (txn.fieldConfidences?.toAccount ?? txn.fieldConfidences?.fromAccount ?? 0)
            : (txn.fieldConfidences?.fromAccount ?? 0);
        const shouldShowAccountSuggestions =
          !!txn.accountCandidates?.length && (!accountValue || accountConfidence < 0.6);

        const borderColor =
          txn.parsingStatus === 'success'
            ? 'border-green-500'
            : txn.parsingStatus === 'partial'
              ? 'border-amber-500'
              : 'border-red-500';
        const badgeVariant =
          txn.parsingStatus === 'success'
            ? 'success'
            : txn.parsingStatus === 'partial'
              ? 'warning'
              : 'destructive';
        return (
        <Card key={index} className={`p-[var(--card-padding)] mb-4 border ${borderColor}`}>
          <div className="flex justify-between mb-2 items-center">
            <p className="text-sm text-gray-500 break-words">{txn.rawMessage}</p>
            <div className="flex items-center gap-1">
              {txn.confidence !== undefined && (
                <Badge variant={badgeVariant} className="shrink-0 ml-2">
                  {Math.round(txn.confidence * 100)}%
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => toggleSkip(index)}>
                <Ban className={`h-4 w-4 ${txn.skipped ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={txn.vendor}
              onChange={e => handleFieldChange(index, 'vendor', e.target.value)}
              className={`p-2 dark:bg-black dark:text-white dark:border-zinc-700 ${
                (txn.fieldConfidences?.vendor ?? 0) >= 0.8
                  ? 'border-green-500'
                  : (txn.fieldConfidences?.vendor ?? 0) >= 0.4
                    ? 'border-amber-500'
                    : 'border-red-500'
              }`}
            />
            <Input
              value={txn.title}
              readOnly
              className="p-2 text-gray-600 bg-gray-50 dark:bg-black dark:text-white dark:border-zinc-700"
            />
            <Input
              value={txn.amount || ''}
              onChange={e => handleFieldChange(index, 'amount', e.target.value)}
              className={`p-2 dark:bg-black dark:text-white dark:border-zinc-700 ${
                (txn.fieldConfidences?.amount ?? 0) >= 0.8
                  ? 'border-green-500'
                  : (txn.fieldConfidences?.amount ?? 0) >= 0.4
                    ? 'border-amber-500'
                    : 'border-red-500'
              }`}
            />
            <Input
              value={txn.currency || ''}
              onChange={e => handleFieldChange(index, 'currency', e.target.value)}
              className={`p-2 dark:bg-black dark:text-white dark:border-zinc-700 ${
                (txn.fieldConfidences?.currency ?? 0) >= 0.8
                  ? 'border-green-500'
                  : (txn.fieldConfidences?.currency ?? 0) >= 0.4
                    ? 'border-amber-500'
                    : 'border-red-500'
              }`}
            />
            <Input
              type="date"
              value={txn.date?.split('T')[0] || ''}
              onChange={e => handleFieldChange(index, 'date', e.target.value)}
              className={`p-2 dark:bg-black dark:text-white dark:border-zinc-700 ${
                (txn.fieldConfidences?.date ?? 0) >= 0.8
                  ? 'border-green-500'
                  : (txn.fieldConfidences?.date ?? 0) >= 0.4
                    ? 'border-amber-500'
                    : 'border-red-500'
              }`}
            />
            <Select
              value={txn.category}
              onValueChange={value => handleFieldChange(index, 'category', value)}
            >
              <SelectTrigger
                className={`p-2 dark:bg-black dark:text-white dark:border-zinc-700 ${
                  (txn.fieldConfidences?.category ?? 0) >= 0.8
                    ? 'border-green-500'
                    : (txn.fieldConfidences?.category ?? 0) >= 0.4
                      ? 'border-amber-500'
                      : 'border-red-500'
                }`}
              >
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
              <SelectTrigger
                className={`p-2 dark:bg-black dark:text-white dark:border-zinc-700 ${
                  (txn.fieldConfidences?.subcategory ?? 0) >= 0.8
                    ? 'border-green-500'
                    : (txn.fieldConfidences?.subcategory ?? 0) >= 0.4
                      ? 'border-amber-500'
                      : 'border-red-500'
                }`}
              >
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
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                checked={txn.alwaysApply || false}
                onCheckedChange={checked => handleAlwaysApplyChange(index, !!checked)}
                className="mr-2"
                aria-labelledby={`always-apply-label-${index}`}
              />
              <label id={`always-apply-label-${index}`} className="text-sm" htmlFor={`always-apply-${index}`}>
                Always apply for this sender
              </label>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm text-muted-foreground">
                {txn.type === 'income' ? 'To account' : 'From account'}
              </label>
              <Input
                value={accountValue}
                onChange={e =>
                  handleFieldChange(
                    index,
                    accountFieldName,
                    e.target.value
                  )
                }
              className={`p-2 dark:bg-black dark:text-white dark:border-zinc-700 ${
                (txn.fieldConfidences?.fromAccount ?? 0) >= 0.8
                  ? 'border-green-500'
                  : (txn.fieldConfidences?.fromAccount ?? 0) >= 0.4
                    ? 'border-amber-500'
                    : 'border-red-500'
              }`}
              />
              {shouldShowAccountSuggestions && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Suggested account from message:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {txn.accountCandidates!.slice(0, 5).map((candidate) => (
                      <Button
                        key={`${candidate.value}-${candidate.labelHint}`}
                        type="button"
                        size="sm"
                        variant={accountValue === candidate.value ? 'default' : 'outline'}
                        onClick={() =>
                          handleFieldChange(index, accountFieldName, candidate.value)
                        }
                        className="h-7 px-2 text-xs"
                      >
                        {candidate.value}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ToggleGroup
              type="single"
              value={txn.type}
              onValueChange={val =>
                val && handleFieldChange(index, 'type', val)
              }
              className={`flex justify-start ${
                (txn.fieldConfidences?.type ?? 0) >= 0.8
                  ? 'border border-green-500'
                  : (txn.fieldConfidences?.type ?? 0) >= 0.4
                    ? 'border border-amber-500'
                    : 'border border-red-500'
              } col-span-2`}
            >
              <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
              <ToggleGroupItem value="income">Income</ToggleGroupItem>
              <ToggleGroupItem value="transfer">Transfer</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex justify-end mt-2 col-span-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const inferenceDTO = normalizeInferenceDTO({
                  ...(txn.inferenceDTO || {}),
                  transaction: txn,
                  rawMessage: txn.rawMessage,
                  senderHint: txn.sender,
                  confidence: txn.confidence,
                  fieldConfidences: txn.fieldConfidences,
                  parsingStatus: txn.parsingStatus,
                  origin: txn.inferenceDTO?.origin,
                  matchOrigin: txn.inferenceDTO?.matchOrigin,
                  mode: 'create',
                  isSuggested: true,
                });

                navigate('/edit-transaction', {
                  state: inferenceDTO,
                });
              }}
            >
              Full Form
            </Button>
          </div>
        </Card>
      );
      })}

      {allHighConfidence && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full mt-4">Confirm All</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
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

      </Layout>
    </>
  );
};

export default ReviewSmsTransactions;
