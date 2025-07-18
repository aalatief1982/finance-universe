
export type TransactionType = 'income' | 'expense' | 'transfer';

// Source type used throughout the app
export type TransactionSource = 'manual' | 'import' | 'sms' | 'telegram' | 'smart-paste' | 'sms-import';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  type: TransactionType;
  notes?: string;
  source: TransactionSource;
  details?: {
    [key: string]: any;
    sms?: {
      sender: string;
      message: string;
      timestamp: string;
    },
    rawMessage?: string;
  };
  currency?: string;
  person?: string ;
  fromAccount?: string;
  toAccount?: string;
  country?: string;
  description?: string;
  originalCurrency?: string;
  vendor?: string;
  account?: string;
  createdAt?: string;
  /** Indicates whether the transaction was seeded as a demo sample */
  isSample?: boolean;
}

// Category related types
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

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  metadata?: CategoryMetadata;
  subcategories?: Category[];
  /** Indicates entry was added by the user */
  user?: boolean;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: CategoryWithSubcategories[];
}

export interface CategoryRule {
  id: string;
  pattern: string;
  categoryId: string;
  isRegex?: boolean;
  priority: number;
  description?: string;
}

export interface TransactionCategoryChange {
  transactionId: string;
  oldCategoryId?: string;
  newCategoryId: string;
  timestamp: string;
}

// Analytics related types
export interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategorySummary {
  name: string;
  value: number;
}

export type TimePeriod = 'week' | 'month' | 'year' | 'all';

export interface TimePeriodData {
  date: string;
  income: number;
  expense: number;
}
