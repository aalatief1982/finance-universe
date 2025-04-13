
export interface Template {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'transfer';
  fromAccount: string;
  raw: string;
  generated?: string;
  timestamp?: string;
}
