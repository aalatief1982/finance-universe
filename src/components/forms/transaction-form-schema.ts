
import { z } from 'zod';
import { getPeopleNames } from '@/lib/people-utils';

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
  fromAccount: z.string().min(1, {
    message: "From Account is required.",
  }),
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
}).refine(data => {
  // If transaction type is transfer, both accounts are required
  if (data.type === 'transfer') {
    if (!data.toAccount) return false;
    if (!data.fromAccount) return false;
  }
  return true;
}, {
  message: "Both From and To accounts are required for transfers",
  path: ["toAccount"]
}).refine(data => {
  // If transaction type is transfer, accounts must be different
  if (data.type === 'transfer' && data.fromAccount && data.toAccount) {
    return data.fromAccount !== data.toAccount;
  }
  return true;
}, {
  message: "Transfer accounts must be different",
  path: ["toAccount"]
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
