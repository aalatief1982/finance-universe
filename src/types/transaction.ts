/**
 * @file transaction.ts
 * @description Domain types for transactions, categories, and analytics summaries.
 *
 * @responsibilities
 * - Define canonical transaction shape used across services, storage, and UI
 * - Document category and rule metadata contracts for inference pipelines
 * - Provide analytics summary types used by charts and reports
 *
 * @review-tags
 * - @invariant: transfer pairs share transferId and opposing transferDirection
 * - @risk: category IDs referenced by transactions should exist in storage
 *
 * @review-checklist
 * - [ ] Transfer pairs include one 'out' and one 'in' direction
 * - [ ] Category IDs referenced by transactions exist in storage
 */
export type TransactionType = 'income' | 'expense' | 'transfer';
// Source type used throughout the app
export type TransactionSource = 'manual' | 'import' | 'sms' | 'telegram' | 'smart-paste' | 'sms-import';

/**
 * Core transaction record used across storage, services, and UI layers.
 *
 * @invariants
 * - transferId links two records for transfers (one out, one in)
 * - transferDirection is 'out' for debit (negative), 'in' for credit (positive)
 * - category should resolve to a stored Category ID or label
 */
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
  /** Unique ID linking both halves of a transfer transaction */
  transferId?: string;
  /** Indicates which side of a transfer this record represents */
  transferDirection?: 'out' | 'in';
}

// Category related types
export interface CategoryIcon {
  name: string;
  color?: string;
}

/**
 * Metadata for category configuration and UI preferences.
 * @review-focus Ensure createdAt/updatedAt are set for user-created categories.
 */
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

/**
 * Rule that maps patterns to category IDs for auto-categorization.
 * @review-focus Priority ordering impacts rule application order.
 */
export interface CategoryRule {
  id: string;
  pattern: string;
  categoryId: string;
  isRegex?: boolean;
  priority: number;
  description?: string;
}

/**
 * Records a category change event for audit/history and ML feedback.
 */
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
