import { Transaction, Category, CategoryRule, TransactionCategoryChange } from "@/types/transaction";
import { handleError } from "@/utils/error-utils";
import { ErrorType } from "@/types/error";
import { 
  validateData, 
  transactionSchema, 
  categorySchema, 
  categoryRuleSchema, 
  transactionCategoryChangeSchema,
  userPreferencesSchema,
  budgetSchema,
  ValidatedUserPreferences,
  ValidatedBudget
} from "@/lib/validation";

// Storage keys
const TRANSACTIONS_STORAGE_KEY = 'transactions';
const CATEGORIES_STORAGE_KEY = 'categories';
const CATEGORY_RULES_STORAGE_KEY = 'categoryRules';
const CATEGORY_CHANGES_STORAGE_KEY = 'categoryChanges';
const USER_PREFERENCES_STORAGE_KEY = 'userPreferences';
const BUDGETS_STORAGE_KEY = 'budgets';
const DATA_VERSION_KEY = 'dataVersion';

// Current data version - increment when data structure changes
const CURRENT_DATA_VERSION = '1.0';

// Helper function to safely parse JSON with validation
const safelyParseJSON = <T>(json: string | null, defaultValue: T): T => {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
};

// Helper function to safely stringify JSON
const safelyStringifyJSON = (data: any): string => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error stringifying JSON:", error);
    return "{}";
  }
};

// Helper function to safely store data
const safelyStoreData = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, safelyStringifyJSON(data));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: `Failed to save data for key: ${key}`,
      originalError: error
    });
  }
};

// Helper function to safely get data
const safelyGetData = <T>(key: string, defaultValue: T): T => {
  try {
    const storedData = localStorage.getItem(key);
    return safelyParseJSON(storedData, defaultValue);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: `Failed to load data for key: ${key}`,
      originalError: error
    });
    return defaultValue;
  }
};

// Data version functions
export const getDataVersion = (): string => {
  return safelyGetData(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
};

export const setDataVersion = (): void => {
  safelyStoreData(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
};

// Transaction storage functions
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

export const storeTransaction = (transaction: Transaction): void => {
  try {
    const transactions = getStoredTransactions();
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.unshift(transaction);
    }
    
    storeTransactions(transactions);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save transaction to storage',
      originalError: error
    });
  }
};

export const removeTransaction = (transactionId: string): void => {
  try {
    const transactions = getStoredTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== transactionId);
    storeTransactions(filteredTransactions);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to remove transaction from storage',
      originalError: error
    });
  }
};

// Category storage functions
export const getStoredCategories = (): Category[] => {
  try {
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!storedCategories) {
      return [];
    }
    
    const parsedData = JSON.parse(storedCategories);
    
    // Validate each category
    const validCategories: Category[] = [];
    
    if (Array.isArray(parsedData)) {
      parsedData.forEach((item, index) => {
        const validationResult = validateData(categorySchema, item);
        
        if (validationResult.success) {
          validCategories.push(validationResult.data);
        } else {
          console.warn(`Invalid category at index ${index}:`, validationResult.error);
        }
      });
    }
    
    return validCategories;
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

export const storeCategory = (category: Category): void => {
  try {
    const categories = getStoredCategories();
    const existingIndex = categories.findIndex(c => c.id === category.id);
    
    if (existingIndex >= 0) {
      categories[existingIndex] = category;
    } else {
      categories.push(category);
    }
    
    storeCategories(categories);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save category to storage',
      originalError: error
    });
  }
};

export const removeCategory = (categoryId: string): void => {
  try {
    const categories = getStoredCategories();
    const filteredCategories = categories.filter(c => c.id !== categoryId);
    storeCategories(filteredCategories);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to remove category from storage',
      originalError: error
    });
  }
};

export const getCategoryHierarchy = (): Category[] => {
  try {
    const allCategories = getStoredCategories();
    const rootCategories: Category[] = [];
    const categoriesMap: Record<string, Category> = {};
    
    // Create a map for quick lookup
    allCategories.forEach(category => {
      categoriesMap[category.id] = { ...category, subcategories: [] };
    });
    
    // Build the hierarchy
    allCategories.forEach(category => {
      if (category.parentId && categoriesMap[category.parentId]) {
        if (!categoriesMap[category.parentId].subcategories) {
          categoriesMap[category.parentId].subcategories = [];
        }
        categoriesMap[category.parentId].subcategories!.push(categoriesMap[category.id]);
      } else {
        rootCategories.push(categoriesMap[category.id]);
      }
    });
    
    return rootCategories;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to build category hierarchy',
      originalError: error
    });
    return [];
  }
};

// Category rules functions
export const getStoredCategoryRules = (): CategoryRule[] => {
  try {
    const storedRules = localStorage.getItem(CATEGORY_RULES_STORAGE_KEY);
    if (!storedRules) {
      return [];
    }
    
    const parsedData = JSON.parse(storedRules);
    
    // Validate each rule
    const validRules: CategoryRule[] = [];
    
    if (Array.isArray(parsedData)) {
      parsedData.forEach((item, index) => {
        const validationResult = validateData(categoryRuleSchema, item);
        
        if (validationResult.success) {
          validRules.push(validationResult.data);
        } else {
          console.warn(`Invalid category rule at index ${index}:`, validationResult.error);
        }
      });
    }
    
    return validRules;
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

export const storeCategoryRule = (rule: CategoryRule): void => {
  try {
    const rules = getStoredCategoryRules();
    const existingIndex = rules.findIndex(r => r.id === rule.id);
    
    if (existingIndex >= 0) {
      rules[existingIndex] = rule;
    } else {
      rules.push(rule);
    }
    
    storeCategoryRules(rules);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save category rule to storage',
      originalError: error
    });
  }
};

export const removeCategoryRule = (ruleId: string): void => {
  try {
    const rules = getStoredCategoryRules();
    const filteredRules = rules.filter(r => r.id !== ruleId);
    storeCategoryRules(filteredRules);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to remove category rule from storage',
      originalError: error
    });
  }
};

// Category changes tracking
export const getStoredCategoryChanges = (): TransactionCategoryChange[] => {
  try {
    const storedChanges = localStorage.getItem(CATEGORY_CHANGES_STORAGE_KEY);
    if (!storedChanges) {
      return [];
    }
    
    const parsedData = JSON.parse(storedChanges);
    
    // Validate each change
    const validChanges: TransactionCategoryChange[] = [];
    
    if (Array.isArray(parsedData)) {
      parsedData.forEach((item, index) => {
        const validationResult = validateData(transactionCategoryChangeSchema, item);
        
        if (validationResult.success) {
          validChanges.push(validationResult.data);
        } else {
          console.warn(`Invalid category change at index ${index}:`, validationResult.error);
        }
      });
    }
    
    return validChanges;
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

export const addCategoryChange = (change: TransactionCategoryChange): void => {
  try {
    const changes = getStoredCategoryChanges();
    changes.push(change);
    storeCategoryChanges(changes);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to add category change to storage',
      originalError: error
    });
  }
};

// User preferences storage
export const getUserPreferences = (): ValidatedUserPreferences | null => {
  try {
    const storedPreferences = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (!storedPreferences) {
      return null;
    }
    
    const parsedData = JSON.parse(storedPreferences);
    const validationResult = validateData(userPreferencesSchema, parsedData);
    
    if (validationResult.success) {
      return validationResult.data;
    } else {
      console.warn('Invalid user preferences:', validationResult.error);
      return null;
    }
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load user preferences from storage',
      originalError: error
    });
    return null;
  }
};

export const storeUserPreferences = (preferences: ValidatedUserPreferences): void => {
  try {
    localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save user preferences to storage',
      originalError: error
    });
  }
};

// Budget storage functions
export const getStoredBudgets = (): ValidatedBudget[] => {
  try {
    const storedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (!storedBudgets) {
      return [];
    }
    
    const parsedData = JSON.parse(storedBudgets);
    
    // Validate each budget
    const validBudgets: ValidatedBudget[] = [];
    
    if (Array.isArray(parsedData)) {
      parsedData.forEach((item, index) => {
        const validationResult = validateData(budgetSchema, item);
        
        if (validationResult.success) {
          validBudgets.push(validationResult.data);
        } else {
          console.warn(`Invalid budget at index ${index}:`, validationResult.error);
        }
      });
    }
    
    return validBudgets;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load budgets from storage',
      originalError: error
    });
    return [];
  }
};

export const storeBudgets = (budgets: ValidatedBudget[]): void => {
  try {
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save budgets to storage',
      originalError: error
    });
  }
};

export const storeBudget = (budget: ValidatedBudget): void => {
  try {
    const budgets = getStoredBudgets();
    const existingIndex = budgets.findIndex(b => b.id === budget.id);
    
    if (existingIndex >= 0) {
      budgets[existingIndex] = budget;
    } else {
      budgets.push(budget);
    }
    
    storeBudgets(budgets);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save budget to storage',
      originalError: error
    });
  }
};

export const removeBudget = (budgetId: string): void => {
  try {
    const budgets = getStoredBudgets();
    const filteredBudgets = budgets.filter(b => b.id !== budgetId);
    storeBudgets(filteredBudgets);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to remove budget from storage',
      originalError: error
    });
  }
};

// Data backup and restore functions
export const backupData = (): string => {
  try {
    const backup = {
      version: CURRENT_DATA_VERSION,
      timestamp: new Date().toISOString(),
      transactions: getStoredTransactions(),
      categories: getStoredCategories(),
      categoryRules: getStoredCategoryRules(),
      categoryChanges: getStoredCategoryChanges(),
      userPreferences: getUserPreferences(),
      budgets: getStoredBudgets()
    };
    
    return JSON.stringify(backup);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to create data backup',
      originalError: error
    });
    return '';
  }
};

export const restoreData = (backupJson: string): boolean => {
  try {
    const backup = JSON.parse(backupJson);
    
    // Basic validation of backup data
    if (!backup || typeof backup !== 'object' || !backup.version) {
      console.error('Invalid backup data');
      return false;
    }
    
    // Store each type of data if present
    if (Array.isArray(backup.transactions)) {
      storeTransactions(backup.transactions);
    }
    
    if (Array.isArray(backup.categories)) {
      storeCategories(backup.categories);
    }
    
    if (Array.isArray(backup.categoryRules)) {
      storeCategoryRules(backup.categoryRules);
    }
    
    if (Array.isArray(backup.categoryChanges)) {
      storeCategoryChanges(backup.categoryChanges);
    }
    
    if (backup.userPreferences) {
      storeUserPreferences(backup.userPreferences);
    }
    
    if (Array.isArray(backup.budgets)) {
      storeBudgets(backup.budgets);
    }
    
    // Set the data version
    setDataVersion();
    
    return true;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to restore data from backup',
      originalError: error
    });
    return false;
  }
};

// Clear all stored data
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
    localStorage.removeItem(CATEGORY_RULES_STORAGE_KEY);
    localStorage.removeItem(CATEGORY_CHANGES_STORAGE_KEY);
    localStorage.removeItem(USER_PREFERENCES_STORAGE_KEY);
    localStorage.removeItem(BUDGETS_STORAGE_KEY);
    localStorage.removeItem(DATA_VERSION_KEY);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to clear all data from storage',
      originalError: error
    });
  }
};
