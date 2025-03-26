
import { Transaction } from "@/types/transaction";

const TRANSACTIONS_STORAGE_KEY = 'transactions';

export const getStoredTransactions = (): Transaction[] => {
  const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  return storedTransactions ? JSON.parse(storedTransactions) : [];
};

export const storeTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
};
