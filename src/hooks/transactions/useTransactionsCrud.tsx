import { useState, useCallback } from 'react';
import {
  Transaction,
  TransactionId,
  TransactionType,
} from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';

type TransactionDraft = Pick<
  Transaction,
  'title' | 'amount' | 'category' | 'date' | 'notes' | 'fromAccount' | 'toAccount' | 'currency' | 'description'
> & { id?: TransactionId; source?: Transaction['source'] };

const isTransactionSource = (value: unknown): value is Transaction['source'] =>
  value === 'manual' ||
  value === 'import' ||
  value === 'sms' ||
  value === 'telegram' ||
  value === 'smart-paste' ||
  value === 'sms-import';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toTransactionDraft = (value: unknown): TransactionDraft => {
  if (!isRecord(value)) {
    throw new Error('Invalid transaction payload');
  }

  const title = typeof value.title === 'string' ? value.title : '';
  const amount = typeof value.amount === 'number' ? value.amount : 0;
  const category = typeof value.category === 'string' ? value.category : 'Uncategorized';
  const date = typeof value.date === 'string' ? value.date : new Date().toISOString();

  return {
    title,
    amount,
    category,
    date,
    notes: typeof value.notes === 'string' ? value.notes : undefined,
    fromAccount: typeof value.fromAccount === 'string' ? value.fromAccount : undefined,
    toAccount: typeof value.toAccount === 'string' ? value.toAccount : undefined,
    currency: typeof value.currency === 'string' ? value.currency : 'USD',
    description: typeof value.description === 'string' ? value.description : undefined,
    source: isTransactionSource(value.source) ? value.source : 'manual',
    id: typeof value.id === 'string' ? value.id : undefined,
  };
};

export function useTransactionsCrud() {
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const { toast } = useToast();

  const openEditDialog = useCallback((transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsEditingExpense(true);
  }, []);

  const createTransaction = useCallback((tx: Transaction | TransactionDraft): Transaction => {
    const draft = toTransactionDraft(tx);
    const type: TransactionType = draft.amount >= 0 ? 'income' : 'expense';

    return {
      id: draft.id ?? crypto.randomUUID(),
      title: draft.title,
      amount: draft.amount,
      category: draft.category,
      date: draft.date,
      type,
      notes: draft.notes,
      fromAccount: draft.fromAccount,
      toAccount: draft.toAccount,
      description: draft.description,
      currency: draft.currency,
      source: draft.source ?? 'manual',
    };
  }, []);

  const updateTransaction = useCallback(
    (id: TransactionId, patch: Partial<Transaction>): Transaction => {
      if (!currentTransaction || currentTransaction.id !== id) {
        throw new Error('No transaction available for update');
      }

      const nextAmount = patch.amount ?? currentTransaction.amount;
      const type: TransactionType = nextAmount >= 0 ? 'income' : 'expense';

      const updatedTransaction: Transaction = {
        ...currentTransaction,
        ...patch,
        id,
        type,
      };

      setIsEditingExpense(false);
      setCurrentTransaction(null);
      return updatedTransaction;
    },
    [currentTransaction]
  );

  const deleteTransaction = useCallback(
    (id: TransactionId): void => {
      toast({
        title: 'Transaction Deleted',
        description: 'Your transaction has been deleted successfully.',
      });
      void id;
    },
    [toast]
  );

  const handleAddTransaction = useCallback((formData: unknown) => {
    const created = createTransaction(toTransactionDraft(formData));
    setIsAddingExpense(false);
    return created;
  }, [createTransaction]);

  const handleEditTransaction = useCallback(
    (formData: unknown) => {
      if (!currentTransaction) return null;
      const patch = toTransactionDraft(formData);
      return updateTransaction(currentTransaction.id, patch);
    },
    [currentTransaction, updateTransaction]
  );

  const handleDeleteTransaction = useCallback((id: TransactionId) => {
    deleteTransaction(id);
    return id;
  }, [deleteTransaction]);

  return {
    currentTransaction,
    setCurrentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    handleAddTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    openEditDialog,
  };
}
