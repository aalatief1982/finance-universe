/**
 * @file transaction-form-schema.ts
 * @description UI component for transaction-form-schema.
 *
 * @module components/forms/transaction-form-schema
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import { z } from 'zod';
import type { Transaction, TransactionType } from '@/types/transaction';
import { validateTransactionForm as validateTransactionValues } from '@/lib/transaction-validation';

type TransactionFormValidationInput = Pick<
  Transaction,
  | 'title'
  | 'amount'
  | 'type'
  | 'fromAccount'
  | 'toAccount'
  | 'category'
  | 'subcategory'
  | 'date'
  | 'currency'
  | 'description'
  | 'notes'
>;

export type TransactionValidationErrors = Partial<Record<keyof TransactionFormValidationInput, string>>;

export const validateTransactionForm = (
  values: Partial<TransactionFormValidationInput>,
  txType: TransactionType = values.type || 'expense',
): TransactionValidationErrors => {
  return validateTransactionValues(values, txType) as TransactionValidationErrors;
};

export const transactionFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  amount: z.coerce.number().min(0.01, {
    message: 'Amount must be greater than 0.',
  }).max(999999.99, {
    message: 'Amount cannot exceed 999,999.99',
  }),
  type: z.enum(['expense', 'income', 'transfer']),
  fromAccount: z.string().optional(),
  toAccount: z.string().optional(),
  category: z.string().min(1, {
    message: 'Please select a category.',
  }),
  subcategory: z.string().optional(),
  date: z.string().min(1, {
    message: 'Please select a date.',
  }),
  description: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().min(1, {
    message: 'Please select a currency.',
  }),
}).superRefine((data, ctx) => {
  const errors = validateTransactionForm(data, data.type);

  Object.entries(errors).forEach(([fieldName, message]) => {
    if (!message) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [fieldName],
      message,
    });
  });
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const DEFAULT_FORM_VALUES: Partial<TransactionFormValues> = {
  title: '',
  amount: undefined,
  category: '',
  subcategory: '',
  date: new Date().toISOString().split('T')[0],
  type: 'expense',
  fromAccount: '',
  toAccount: '',
  description: '',
  notes: '',
  currency: 'USD',
};

export const ACCOUNTS = [
  'Cash', 'Bank Account', 'Credit Card', 'Savings', 'Investment', 'Other',
];

export const CURRENCIES = [
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'BHD', name: 'Bahraini Dinar' },
  { code: 'AED', name: 'UAE Dirham' },
];
