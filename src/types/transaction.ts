
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // Changed from Date to string
  type: TransactionType;
  notes?: string;
  source?: 'manual' | 'sms' | 'import';
  description?: string;
  person?: string;
  fromAccount?: string;
  toAccount?: string;
  currency?: string;
  originalCurrency?: string;
  categoryPath?: string; // Add this to support components that use it
  smsDetails?: {
    sender: string;
    message: string;
    timestamp: string;
  };
}

// Add commonly used types related to transactions
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  icon?: string;
  color?: string;
  subcategories?: Category[];
  metadata?: CategoryMetadata;
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

export interface CategoryIcon {
  name: string;
  color?: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories?: CategoryWithSubcategories[];
  transactionType?: TransactionType; // Add this property for categories-data.ts
}

export interface CategoryRule {
  id: string;
  pattern: string;
  categoryId: string;
  isRegex?: boolean;
  priority: number;
  description?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  count: number;
  period: string;
  income?: number;
  expense?: number;
  // Add these properties to match how it's used in components
  expenses?: number;
  balance?: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
  name?: string;
  value?: number;
}

export type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface TimePeriodData {
  period: string;
  income: number;
  expense: number;
  net: number;
  date?: string;
}

export interface TransactionCategoryChange {
  transactionId: string;
  oldCategoryId?: string;
  newCategoryId: string;
  timestamp: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
