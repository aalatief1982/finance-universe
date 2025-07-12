import { Transaction, TransactionType } from '@/types/transaction';
import { getCategoriesForType, getSubcategoriesForCategory } from './categories-data';
import { toast } from '@/components/ui/use-toast';

export const isValidAmount = (amount: any): boolean => {
  return typeof amount === 'number' && !isNaN(amount) && Math.abs(amount) > 0;
};

export const isValidDate = (dateStr: string): boolean => {
  const timestamp = Date.parse(dateStr);
  return !isNaN(timestamp) && timestamp <= Date.now();
};

export const isValidType = (type: any): type is TransactionType => {
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

export function validateTransactionInput(txn: Transaction): boolean {
  if (!isValidAmount(txn.amount)) {
    toast({ title: 'Invalid amount', description: 'Amount must be a number greater than 0' });
    return false;
  }

  if (!isValidDate(txn.date)) {
    toast({ title: 'Invalid date', description: 'Date must be valid and not in the future' });
    return false;
  }

  if (!isValidType(txn.type)) {
    toast({ title: 'Invalid type', description: 'Type must be income, expense, or transfer' });
    return false;
  }

  if (!isValidCategory(txn.type, txn.category)) {
    toast({ title: 'Invalid category', description: 'Category must be a predefined value' });
    return false;
  }

  if (!isValidSubcategory(txn.category, txn.subcategory)) {
    toast({ title: 'Invalid subcategory', description: 'Subcategory must be a predefined value' });
    return false;
  }

  return true;
}

