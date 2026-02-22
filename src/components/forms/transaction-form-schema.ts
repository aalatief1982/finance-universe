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
  const errors: TransactionValidationErrors = {};

  if (!values.title || values.title.trim().length < 2) {
    errors.title = 'Title must be at least 2 characters.';
  }

  if (typeof values.amount !== 'number' || Number.isNaN(values.amount)) {
    errors.amount = 'Amount must be greater than 0.';
  } else if (values.amount < 0.01) {
    errors.amount = 'Amount must be greater than 0.';
  } else if (values.amount > 999999.99) {
    errors.amount = 'Amount cannot exceed 999,999.99';
  }

  if (!values.category || values.category.trim().length < 1) {
    errors.category = 'Please select a category.';
  }

  if (!values.date || values.date.trim().length < 1) {
    errors.date = 'Please select a date.';
  }

  if (!values.currency || values.currency.trim().length < 1) {
    errors.currency = 'Please select a currency.';
  }

  if (!values.fromAccount || values.fromAccount.trim().length < 1) {
    errors.fromAccount = 'From Account is required.';
  }

  if (txType === 'transfer') {
    if (!values.toAccount || values.toAccount.trim().length < 1) {
      errors.toAccount = 'To Account is required for transfers.';
    } else if (values.fromAccount && values.fromAccount === values.toAccount) {
      errors.toAccount = 'Transfer accounts must be different.';
    }
  }

  return errors;
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
  subcategory: "none", 
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
