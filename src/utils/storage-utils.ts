
import { Transaction } from "@/types/transaction";
import { handleError } from "@/utils/error-utils";
import { ErrorType } from "@/types/error";
import { validateData, transactionSchema } from "@/lib/validation";
import { Category, CategoryRule, TransactionCategoryChange } from "@/types/transaction";

const TRANSACTIONS_STORAGE_KEY = 'transactions';
const CATEGORIES_STORAGE_KEY = 'categories';
const CATEGORY_RULES_STORAGE_KEY = 'categoryRules';
const CATEGORY_CHANGES_STORAGE_KEY = 'categoryChanges';

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
          // If validation succeeded, add to valid transactions
          validTransactions.push(validationResult.data);
        } else {
          // If validation failed, log the warning with the error message
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

// New utility functions for categories
export const getStoredCategories = (): Category[] => {
  try {
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!storedCategories) {
      return [];
    }
    
    const parsedData = JSON.parse(storedCategories);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load categories from storage',
      originalError: error
    });
    return [];
  }
};

export const storeCategories = (categories: Category[]): void => {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save categories to storage',
      originalError: error
    });
  }
};

// Utility functions for category rules
export const getStoredCategoryRules = (): CategoryRule[] => {
  try {
    const storedRules = localStorage.getItem(CATEGORY_RULES_STORAGE_KEY);
    if (!storedRules) {
      return [];
    }
    
    const parsedData = JSON.parse(storedRules);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load category rules from storage',
      originalError: error
    });
    return [];
  }
};

export const storeCategoryRules = (rules: CategoryRule[]): void => {
  try {
    localStorage.setItem(CATEGORY_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save category rules to storage',
      originalError: error
    });
  }
};

// Utility functions for category changes
export const getStoredCategoryChanges = (): TransactionCategoryChange[] => {
  try {
    const storedChanges = localStorage.getItem(CATEGORY_CHANGES_STORAGE_KEY);
    if (!storedChanges) {
      return [];
    }
    
    const parsedData = JSON.parse(storedChanges);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load category changes from storage',
      originalError: error
    });
    return [];
  }
};

export const storeCategoryChanges = (changes: TransactionCategoryChange[]): void => {
  try {
    localStorage.setItem(CATEGORY_CHANGES_STORAGE_KEY, JSON.stringify(changes));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save category changes to storage',
      originalError: error
    });
  }
};
