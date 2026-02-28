import { toast } from '@/components/ui/use-toast';
import { getCategoriesForType, getSubcategoriesForCategory } from './categories-data';
import type { Transaction, TransactionType } from '@/types/transaction';

type TransactionValidatorShape = Pick<Transaction, 'amount' | 'date' | 'type' | 'category' | 'subcategory'>;

export type TransactionValidationResult =
  | { valid: true; transaction: TransactionValidatorShape }
  | { valid: false; error: string };

export const isValidAmount = (amount: unknown): amount is number => {
  return typeof amount === 'number' && !Number.isNaN(amount) && Math.abs(amount) > 0;
};

export const isValidDate = (dateStr: string): boolean => {
  const timestamp = Date.parse(dateStr);
  return !Number.isNaN(timestamp) && timestamp <= Date.now();
};

export const isValidType = (type: unknown): type is TransactionType => {
  return type === 'income' || type === 'expense' || type === 'transfer';
};

export const isValidCategory = (type: TransactionType, category: string): boolean => {
  if (category === 'Uncategorized') return true;
  const categories = getCategoriesForType(type);
  return categories.includes(category);
};

export const isValidSubcategory = (category: string, subcategory?: string): boolean => {
  if (!subcategory || subcategory === 'none') return true;
  const subcats = getSubcategoriesForCategory(category);
  return subcats.includes(subcategory);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const toTransactionValidatorShape = (input: unknown): TransactionValidatorShape | null => {
  if (!isRecord(input)) return null;

  const { amount, date, type, category, subcategory } = input;
  if (typeof date !== 'string' || typeof category !== 'string' || !isValidType(type)) {
    return null;
  }

  if (subcategory !== undefined && typeof subcategory !== 'string') {
    return null;
  }

  if (typeof amount !== 'number') {
    return null;
  }

  return { amount, date, type, category, subcategory: subcategory as string | undefined };
};

export function validateTransactionInput(input: unknown): TransactionValidationResult {
  const txn = toTransactionValidatorShape(input);

  if (!txn) {
    toast({ title: 'Invalid transaction', description: 'Transaction payload is malformed' });
    return { valid: false, error: 'Transaction payload is malformed' };
  }

  if (!isValidAmount(txn.amount)) {
    const error = 'Amount must be a number greater than 0';
    toast({ title: 'Invalid amount', description: error });
    return { valid: false, error };
  }

  if (!isValidDate(txn.date)) {
    const error = 'Date must be valid and not in the future';
    toast({ title: 'Invalid date', description: error });
    return { valid: false, error };
  }

  if (!isValidCategory(txn.type, txn.category)) {
    const error = 'Category must be a predefined value';
    toast({ title: 'Invalid category', description: error });
    return { valid: false, error };
  }

  if (!isValidSubcategory(txn.category, txn.subcategory)) {
    const error = 'Subcategory must be a predefined value';
    toast({ title: 'Invalid subcategory', description: error });
    return { valid: false, error };
  }

  return { valid: true, transaction: txn };
}
