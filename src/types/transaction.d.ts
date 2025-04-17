
export type TransactionType = 'income' | 'expense' | 'transfer';
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
    sms?: {
      sender: string;
      message: string;
      timestamp: string;
    }
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

export interface CategoryWithSubcategories extends Category {
  subcategories: CategoryWithSubcategories[];
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
  oldCategoryId?: string;
  newCategoryId: string;
}

export type FieldSource = 'template' | 'regex' | 'suggestion' | 'ml' | 'manual';

export type Currency = 'SAR' | 'EGP' | 'USD' | 'BHD' | 'AED';

// Fixed the duplicate naming issue by using a different name
export type CategoryType = 'Salary' | 'Shopping' | 'Car' | 'Health' | 'Education' | 'Others' | 'Investment' | 'Transfer';

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
  category: TransactionField<CategoryType>;
  subcategory: TransactionField<Subcategory>;
  person: TransactionField<Person>;
  description: TransactionField<string>;

  createdAt: string;
  updatedAt?: string;
}
