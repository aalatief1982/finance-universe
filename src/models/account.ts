export interface Account {
  id: string;
  name: string;
  type: 'Bank' | 'Cash' | 'Crypto' | 'Gold' | 'Stocks' | 'Sukuk' | 'Real Estate' | 'Loan';
  currency: string;
  initialBalance: number;
  startDate: string;
  tags?: string[];
}
