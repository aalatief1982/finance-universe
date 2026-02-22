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
import { getPeopleNames } from '@/lib/people-utils';
import { validateTransaction } from '@/lib/transaction-validation';

type TransactionValidationInput = {
  title?: string;
  amount?: number;
  type?: 'expense' | 'income' | 'transfer';
  fromAccount?: string;
  toAccount?: string;
  category?: string;
  date?: string;
  currency?: string;
};

export type TransactionValidationErrors = Partial<Record<keyof TransactionValidationInput, string>>;

export const validateTransactionForm = (
  values: Partial<TransactionValidationInput>,
  txType: NonNullable<TransactionValidationInput['type']> = values.type || 'expense'
): TransactionValidationErrors => {
  return validateTransaction(values as any, txType) as TransactionValidationErrors;
};

export const transactionFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  amount: z.coerce.number().min(0.01, {
    message: "Amount must be greater than 0.",
  }).max(999999.99, {
    message: "Amount cannot exceed 999,999.99",
  }),
  type: z.enum(["expense", "income", "transfer"]),
  fromAccount: z.string().optional(),
  toAccount: z.string().optional(),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  subcategory: z.string().optional(),
  date: z.string().min(1, {
    message: "Please select a date.",
  }),
  description: z.string().optional(),
  notes: z.string().optional(),
  person: z.string().optional(),
  currency: z.string().min(1, {
    message: "Please select a currency.",
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
  title: "",
  amount: undefined,
  category: "",
  subcategory: '',
  date: new Date().toISOString().split('T')[0],
  type: "expense",
  fromAccount: "",
  toAccount: "",
  description: "",
  notes: "",
  person: "none",
  currency: "SAR",
};

export const ACCOUNTS = [
  "Cash", "Bank Account", "Credit Card", "Savings", "Investment", "Other"
];

export const CURRENCIES = [
  { code: "SAR", name: "Saudi Riyal" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "USD", name: "US Dollar" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "AED", name: "UAE Dirham" }
];

export const PEOPLE = getPeopleNames();
