import { z } from 'zod';
import { 
  transactionSchema, 
  categorySchema, 
  categoryRuleSchema, 
  transactionCategoryChangeSchema,
  budgetSchema
} from '@/lib/validation';

export type Transaction = z.infer<typeof transactionSchema> & {
  categoryPath?: string;
  originalCurrency?: string;
  exchangeRate?: number;
  providerDetails?: {
    providerName?: string;
    providerType?: 'bank' | 'payment_app' | 'card' | 'other';
    providerCountry?: string;
    accountLastFourDigits?: string;
    transactionId?: string;
    balanceAfterTransaction?: number;
    isInternational?: boolean;
  };
};

export interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategorySummary {
  name: string;
  value: number;
}

export interface TimePeriodData {
  date: string;
  income: number;
  expense: number;
}

export type TimePeriod = 'week' | 'month' | 'year';

// Categories and categorization system
export interface CategoryIcon {
  name: string;
  color?: string;
}

export interface CategoryMetadata {
  description?: string;
  icon?: CategoryIcon;
  color?: string;
  budget?: number;
  isHidden?: boolean;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Category = z.infer<typeof categorySchema>;

export type CategoryRule = z.infer<typeof categoryRuleSchema>;

export interface CategoryHierarchy {
  categories: Category[];
}

export type TransactionCategoryChange = z.infer<typeof transactionCategoryChangeSchema>;

// Budget interfaces aligned with validation
export type Budget = z.infer<typeof budgetSchema>;

export interface BudgetProgress {
  budgetId: string;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCount: number;
}

// Data import/export interfaces
export interface DataBackup {
  version: string;
  timestamp: string;
  transactions: Transaction[];
  categories: Category[];
  categoryRules: CategoryRule[];
  categoryChanges: TransactionCategoryChange[];
  budgets?: Budget[];
}

// Transaction filtering types
export interface TransactionFilter {
  searchQuery?: string;
  category?: string;
  type?: 'income' | 'expense' | 'all';
  startDate?: Date | null;
  endDate?: Date | null;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
  provider?: string;
  currency?: string;
  country?: string;
}

// Transaction sorting types
export type TransactionSortField = 'date' | 'title' | 'amount' | 'category' | 'provider';
export type SortDirection = 'asc' | 'desc';

export interface TransactionSortOptions {
  field: TransactionSortField;
  direction: SortDirection;
}

// Bank and provider types for better categorization and localization
export interface FinancialProvider {
  id: string;
  name: string;
  country: string;
  type: 'bank' | 'payment_app' | 'card' | 'other';
  patterns: string[];
  logo?: string;
  defaultCurrency: SupportedCurrency;
  // Regular expression patterns to extract transaction details from SMS
  smsPatterns?: {
    amount?: string;
    description?: string;
    date?: string;
    accountNumber?: string;
    balance?: string;
  };
}

// Interface for handling bank-specific SMS providers
export interface BankSmsProvider {
  id: string;
  name: string;
  bankName: string;
  country: string;
  isActive: boolean;
  senderPatterns: string[];
  messagePatterns: {
    debit?: string;
    credit?: string;
    balance?: string;
  };
  extractors: {
    amount: string;
    description: string;
    date: string;
    accountNumber?: string;
  };
}
