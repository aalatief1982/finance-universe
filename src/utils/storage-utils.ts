
import { Transaction } from "@/types/transaction";
import { handleError } from "@/utils/error-utils";
import { ErrorType } from "@/types/error";
import { validateData, transactionSchema } from "@/lib/validation";

const TRANSACTIONS_STORAGE_KEY = 'transactions';

export const getStoredTransactions = (): Transaction[] => {
  try {
    const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!storedTransactions) {
      return [];
    }
    
    const parsedData = JSON.parse(storedTransactions);
    
    // Validate each transaction
    const validTransactions: Transaction[] = [];
    
    if (Array.isArray(parsedData)) {
      parsedData.forEach((item, index) => {
        const validationResult = validateData(transactionSchema, item);
        if (validationResult.success) {
          validTransactions.push(validationResult.data);
        } else {
          console.warn(`Invalid transaction at index ${index}:`, validationResult.error);
        }
      });
    }
    
    return validTransactions;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load transactions from storage',
      originalError: error
    });
    return [];
  }
};

export const storeTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save transactions to storage',
      originalError: error
    });
  }
};

export const clearStoredTransactions = (): void => {
  try {
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to clear transactions from storage',
      originalError: error
    });
  }
};
