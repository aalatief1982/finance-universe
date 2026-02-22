import { Transaction, TransactionType } from '@/types/transaction';

export type TransactionValidationErrors = Partial<
  Record<keyof Transaction, string>
>;

const isBlank = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return value === null || value === undefined;
};

export const validateTransaction = (
  tx: Partial<Transaction>,
  mode?: TransactionType,
): TransactionValidationErrors => {
  const errors: TransactionValidationErrors = {};
  const type = mode || tx.type;

  if (!type) errors.type = 'Type is required';
  if (isBlank(tx.title)) errors.title = 'Title is required';
  if (isBlank(tx.currency)) errors.currency = 'Currency is required';

  const numericAmount = Number(tx.amount);
  if (!Number.isFinite(numericAmount) || numericAmount === 0) {
    errors.amount = 'Amount is required';
  }

  if (isBlank(tx.date)) errors.date = 'Date is required';
  if (isBlank(tx.fromAccount)) errors.fromAccount = 'From account is required';

  if ((type === 'expense' || type === 'income') && isBlank(tx.category)) {
    errors.category = 'Category is required';
  }

  if (type === 'transfer') {
    if (isBlank(tx.toAccount)) {
      errors.toAccount = 'To account is required';
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
