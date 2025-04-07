
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: Date;
  type: 'income' | 'expense';
  notes?: string;
  source?: 'manual' | 'sms' | 'import';
}
