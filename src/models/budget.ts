export interface Budget {
  id: string;
  scope: 'account' | 'category' | 'subcategory';
  targetId: string;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate?: string;
  rollover?: boolean;
  notes?: string;
}
