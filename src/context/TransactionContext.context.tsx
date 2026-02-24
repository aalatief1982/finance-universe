import { createContext } from 'react';
import type { Transaction } from '@/types/transaction';

interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
}

interface CategorySummary {
  name: string;
  category: string;
  transactions: Transaction[];
  total: number;
  value: number;
}

interface TimePeriodData {
  date: string;
  income: number;
  expense: number;
}

interface SmsMessageInput {
  sender?: string;
  body?: string;
  date?: Date;
}

export interface TransactionContextType {
  transactions: Transaction[];
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  clearTransactions: () => void;
  getTransactionsSummary: () => TransactionSummary;
  getTransactionsByCategory: () => CategorySummary[];
  getTransactionsByTimePeriod: (period?: string) => TimePeriodData[];
  processTransactionsFromSMS: (messages: SmsMessageInput[]) => Transaction[];
  addTransaction: (transaction: Transaction) => void;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined,
);
