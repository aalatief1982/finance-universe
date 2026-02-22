import { Transaction, TransactionType } from '@/types/transaction';
import { getSubcategoriesForCategory } from '@/lib/categories-data';

export type TransactionValidationErrors = Partial<
  Record<keyof Transaction, string>
>;

const isBlank = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return value === null || value === undefined;
};

const isMissingSelection = (value: unknown): boolean => {
  if (isBlank(value)) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'none' ||
    normalized === 'select' ||
    normalized === 'select...' ||
    normalized.startsWith('select ')
  );
};

export const validateTransaction = (
  tx: Partial<Transaction>,
  mode?: TransactionType,
): TransactionValidationErrors => {
  const errors: TransactionValidationErrors = {};
  const type = mode || tx.type;

  if (!type) errors.type = 'Type is required';
  if (isBlank(tx.title)) errors.title = 'Title is required';
  if (isMissingSelection(tx.currency)) errors.currency = 'Currency is required';

  const numericAmount = Number(tx.amount);
  if (!Number.isFinite(numericAmount) || numericAmount === 0) {
    errors.amount = 'Amount is required';
  }

  if (isBlank(tx.date)) errors.date = 'Date is required';
  if (isMissingSelection(tx.fromAccount)) errors.fromAccount = 'From account is required';

  if (isMissingSelection(tx.category)) {
    errors.category = 'Category is required';
  }

  const availableSubcategories = tx.category
    ? getSubcategoriesForCategory(tx.category)
    : [];
  const shouldRequireSubcategory = availableSubcategories.length > 0;
  if (shouldRequireSubcategory && isMissingSelection(tx.subcategory)) {
    errors.subcategory = 'Subcategory is required';
  }

  if (type === 'transfer') {
    if (isMissingSelection(tx.toAccount)) {
      errors.toAccount = 'To account is required';
    } else if (tx.fromAccount === tx.toAccount) {
      errors.toAccount = 'To account must be different from from account';
    }
  }

  return errors;
};

export class TransactionValidationError extends Error {
  errors: TransactionValidationErrors;

  constructor(errors: TransactionValidationErrors) {
    super('Transaction validation failed');
    this.name = 'TransactionValidationError';
    this.errors = errors;
  }
}
