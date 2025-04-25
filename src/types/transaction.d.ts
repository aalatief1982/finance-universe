
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  title?: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  type: TransactionType;
  notes?: string;
  source?: string;
  fromAccount?: string;
  toAccount?: string;
  vendor?: string;
  currency?: string;
  person?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  subcategories?: Category[];
  metadata?: {
    color?: string;
    icon?: string;
    budget?: number;
  };
}
