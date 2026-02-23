import { Transaction, TransactionType } from '@/types/transaction';
import { getSubcategoriesForCategory } from '@/lib/categories-data';
import { parseAmount } from '@/lib/amount';

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
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'select' ||
    normalized === 'select...' ||
    normalized.startsWith('select ')
  );
};

export const validateTransaction = (
  tx: Partial<Transaction>,
  mode?: TransactionType,
): TransactionValidationErrors => {
  return validateTransactionForm(tx, mode);
};

export const validateTransactionForm = (
  tx: Partial<Transaction>,
  mode?: TransactionType,
): TransactionValidationErrors => {
  const errors: TransactionValidationErrors = {};
  const type = mode || tx.type;
  const normalizedType = String(type || '').trim().toLowerCase();

  if (!type) errors.type = 'Type is required';
  if (isBlank(tx.title)) errors.title = 'Title is required';
  if (isMissingSelection(tx.currency)) errors.currency = 'Currency is required';

  const numericAmount = parseAmount(tx.amount ?? '');
  const normalizedAmount = Number.isFinite(numericAmount)
    ? Math.abs(numericAmount)
    : numericAmount;

  if (!Number.isFinite(normalizedAmount)) {
    errors.amount = 'Amount is required';
  } else if (normalizedAmount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (isBlank(tx.date)) errors.date = 'Date is required';
  if (isMissingSelection(tx.fromAccount)) errors.fromAccount = 'From account is required';

  if (isMissingSelection(tx.category)) {
    errors.category = 'Category is required';
  }

  if (isMissingSelection(tx.subcategory)) {
    errors.subcategory = 'Subcategory is required';
  } else if (tx.category && getSubcategoriesForCategory(tx.category).length > 0) {
    const availableSubcategories = getSubcategoriesForCategory(tx.category);
    const normalizedSubcategory = String(tx.subcategory).trim().toLowerCase();
    const hasMatch = availableSubcategories.some(
      (subcategory) => subcategory.trim().toLowerCase() === normalizedSubcategory,
    );

    if (!hasMatch) {
      errors.subcategory = 'Subcategory is required';
    }
  }

  if (normalizedType === 'transfer') {
    if (isMissingSelection(tx.toAccount)) {
      errors.toAccount = 'To account is required';
    } else if (String(tx.fromAccount).trim() === String(tx.toAccount).trim()) {
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
