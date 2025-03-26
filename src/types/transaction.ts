
import { z } from 'zod';
import { transactionSchema } from '@/lib/validation';

export type Transaction = z.infer<typeof transactionSchema>;

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

