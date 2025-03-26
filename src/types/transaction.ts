
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  notes?: string;
  source?: 'manual' | 'sms';
  originalCurrency?: string;
  smsDetails?: {
    sender: string;
    message: string;
    timestamp: string;
  };
}

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
