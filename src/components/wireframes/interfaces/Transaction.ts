
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type?: 'income' | 'expense';
  notes?: string;
  source?: 'manual' | 'sms';
  originalCurrency?: string;
  smsDetails?: {
    sender: string;
    message: string;
    timestamp: string;
  };
}
