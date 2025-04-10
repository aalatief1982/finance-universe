
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  type: TransactionType;
  notes?: string;
  source: 'manual' | 'import';
  details?: {
    [key: string]: any;
  };
  currency?: string;
  person?: string;
  fromAccount?: string;
  toAccount?: string;
  country?: string;
}
