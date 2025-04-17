
export type TransactionType = 'income' | 'expense' | 'transfer';

// Source type used throughout the app
export type TransactionSource = 'manual' | 'import' | 'sms' | 'telegram' | 'smart-paste' | 'sms-import';

export type FieldSource = 'template' | 'regex' | 'suggestion' | 'ml' | 'manual';

// Removed duplicate TransactionType definition
export type Currency = 'SAR' | 'EGP' | 'USD' | 'BHD' | 'AED';

export type Category =
  | 'Salary'
  | 'Shopping'
  | 'Car'
  | 'Health'
  | 'Education'
  | 'Others'
  | 'Investment'
  | 'Transfer';

export type Subcategory =
  | 'Main Salary'
  | 'Benefit'
  | 'Bonus'
  | 'Loan Return'
  | 'Sukuk'
  | 'Stocks'
  | 'Grocery'
  | 'Clothing'
  | 'Appliances'
  | 'Misc'
  | 'Gas'
  | 'Maintencance'
  | 'Hospital'
  | 'Pharmacy'
  | 'Gym'
  | 'Tennis'
  | 'Swimming'
  | 'School'
  | 'Course'
  | '';

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
    }
  };
  currency?: string;
  person?: string | 'none' | 'Ahmed' | 'Marwa' | 'Youssef' | 'Salma' | 'Mazen';
  fromAccount?: string;
  toAccount?: string;
  country?: string;
  description?: string;
  originalCurrency?: string;
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

export type Person = 'Ahmed' | 'Marwa' | 'Youssef' | 'Salma' | 'Mazen' | '';

export interface TransactionField<T> {
  value: T;
  source: FieldSource;
  confidence?: number;
}

export interface TransactionDraft {
  id?: string;
  rawMessage: string;
  structureHash?: string;

  type: TransactionField<TransactionType>;
  amount: TransactionField<number>;
  currency: TransactionField<Currency>;
  date: TransactionField<string>; // ISO string
  fromAccount: TransactionField<string>;
  toAccount?: TransactionField<string>; // Only for transfers
  vendor: TransactionField<string>;
  category: TransactionField<Category>;
  subcategory: TransactionField<Subcategory>;
  person: TransactionField<Person>;
  description: TransactionField<string>;

  createdAt: string;
  updatedAt?: string;
}
// Closed the file properly
