
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'manual' | 'import' | 'sms';

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
  fromAccount: string;
  toAccount?: string;
  person?: string;
  currency?: string;
  country?: string;
  description?: string;
  smsDetails?: {
    sender: string;
    message: string;
    timestamp: string;
  };
  details?: {
    location?: string;
    merchant?: string;
    paymentMethod?: string;
    status?: 'pending' | 'completed' | 'cancelled';
  };
}

export interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
  previousBalance?: number;
  changePercentage?: number;
}

export interface CategorySummary {
  name: string;
  value: number;
  color?: string;
}

export interface TimePeriodData {
  date: string;
  income: number;
  expense: number;
}

export type TimePeriod = 'week' | 'month' | 'year' | 'all';

export interface Category {
  id: string;
  name: string;
  metadata?: CategoryMetadata;
  subcategories?: Category[];
  parentId?: string;
}

export interface CategoryWithSubcategories {
  id: string;
  name: string;
  subcategories: string[];
  icon?: string;
  color?: string;
  metadata?: CategoryMetadata;
}

export interface CategoryMetadata {
  color?: string;
  icon?: CategoryIcon;
  description?: string;
  budget?: number;
  updatedAt?: string;
  createdAt?: string;
  isHidden?: boolean;
  isSystem?: boolean;
}

export interface CategoryIcon {
  name?: string;
  color?: string;
}

export interface CategoryRule {
  id: string;
  pattern: string;
  description?: string;
  categoryId: string;
  isRegex?: boolean;
  priority?: number;
}

export interface TransactionCategoryChange {
  timestamp: string;
  transactionId: string;
  oldCategoryId: string;
  newCategoryId: string;
}
