
import { Transaction, TransactionSummary, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { validateTransactionForStorage, validateCategoryForStorage, validateCategoryRuleForStorage, validateCategoryChangeForStorage } from './storage-utils-fixes';

// Storage keys for local storage
const TRANSACTIONS_STORAGE_KEY = 'xpensia_transactions';
const CATEGORIES_STORAGE_KEY = 'xpensia_categories';
const CATEGORY_RULES_STORAGE_KEY = 'xpensia_category_rules';
const CATEGORY_CHANGES_STORAGE_KEY = 'xpensia_category_changes';

// Helper function to safely get data from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from storage:`, error);
    return defaultValue;
  }
};

// Helper function to safely set data in localStorage
const setInStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error storing ${key} in storage:`, error);
  }
};

// Transactions storage functions
export const getStoredTransactions = (): Transaction[] => {
  return getFromStorage<Transaction[]>(TRANSACTIONS_STORAGE_KEY, []);
};

export const storeTransactions = (transactions: Transaction[]): void => {
  setInStorage(TRANSACTIONS_STORAGE_KEY, transactions);
};

export const storeTransaction = (transaction: any): void => {
  try {
    // Use the validation function from storage-utils-fixes.ts to ensure all required fields are present
    const validatedTransaction = validateTransactionForStorage(transaction);
    
    const transactions = getStoredTransactions();
    
    // Check if transaction with same ID already exists (for update)
    const existingIndex = transactions.findIndex(t => t.id === validatedTransaction.id);
    
    if (existingIndex >= 0) {
      // Update existing transaction
      transactions[existingIndex] = validatedTransaction;
    } else {
      // Add new transaction
      transactions.unshift(validatedTransaction);
    }
    
    storeTransactions(transactions);
  } catch (error) {
    console.error('Error storing transaction:', error);
    throw error;
  }
};

export const removeTransaction = (id: string): void => {
  const transactions = getStoredTransactions();
  const updatedTransactions = transactions.filter(t => t.id !== id);
  storeTransactions(updatedTransactions);
};

// Categories storage functions
export const getStoredCategories = (): Category[] => {
  return getFromStorage<Category[]>(CATEGORIES_STORAGE_KEY, []);
};

export const storeCategories = (categories: Category[]): void => {
  setInStorage(CATEGORIES_STORAGE_KEY, categories);
};

export const storeCategory = (category: any): void => {
  try {
    // Use the validation function from storage-utils-fixes.ts to ensure all required fields are present
    const validatedCategory = validateCategoryForStorage(category);
    
    const categories = getStoredCategories();
    
    // Check if category with same ID already exists (for update)
    const existingIndex = categories.findIndex(c => c.id === validatedCategory.id);
    
    if (existingIndex >= 0) {
      // Update existing category
      categories[existingIndex] = validatedCategory;
    } else {
      // Add new category
      categories.push(validatedCategory);
    }
    
    storeCategories(categories);
  } catch (error) {
    console.error('Error storing category:', error);
    throw error;
  }
};

export const removeCategory = (id: string): void => {
  const categories = getStoredCategories();
  const updatedCategories = categories.filter(c => c.id !== id);
  storeCategories(updatedCategories);
};

// Category rules storage functions
export const getStoredCategoryRules = (): CategoryRule[] => {
  return getFromStorage<CategoryRule[]>(CATEGORY_RULES_STORAGE_KEY, []);
};

export const storeCategoryRules = (rules: CategoryRule[]): void => {
  setInStorage(CATEGORY_RULES_STORAGE_KEY, rules);
};

export const storeCategoryRule = (rule: any): void => {
  try {
    // Use the validation function from storage-utils-fixes.ts to ensure all required fields are present
    const validatedRule = validateCategoryRuleForStorage(rule);
    
    const rules = getStoredCategoryRules();
    
    // Check if rule with same ID already exists (for update)
    const existingIndex = rules.findIndex(r => r.id === validatedRule.id);
    
    if (existingIndex >= 0) {
      // Update existing rule
      rules[existingIndex] = validatedRule;
    } else {
      // Add new rule
      rules.push(validatedRule);
    }
    
    storeCategoryRules(rules);
  } catch (error) {
    console.error('Error storing category rule:', error);
    throw error;
  }
};

export const removeCategoryRule = (id: string): void => {
  const rules = getStoredCategoryRules();
  const updatedRules = rules.filter(r => r.id !== id);
  storeCategoryRules(updatedRules);
};

// Category changes storage functions (for tracking and analytics)
export const getStoredCategoryChanges = (): TransactionCategoryChange[] => {
  return getFromStorage<TransactionCategoryChange[]>(CATEGORY_CHANGES_STORAGE_KEY, []);
};

export const storeCategoryChanges = (changes: TransactionCategoryChange[]): void => {
  setInStorage(CATEGORY_CHANGES_STORAGE_KEY, changes);
};

export const addCategoryChange = (change: any): void => {
  try {
    // Use the validation function from storage-utils-fixes.ts to ensure all required fields are present
    const validatedChange = validateCategoryChangeForStorage(change);
    
    const changes = getStoredCategoryChanges();
    changes.push(validatedChange);
    storeCategoryChanges(changes);
  } catch (error) {
    console.error('Error storing category change:', error);
    throw error;
  }
};

// Helper function to get the full category hierarchy with parent-child relationships
export const getCategoryHierarchy = (): any[] => {
  const categories = getStoredCategories();
  const rootCategories = categories.filter(c => !c.parentId);
  
  const buildHierarchy = (category: Category) => {
    const children = categories.filter(c => c.parentId === category.id);
    return {
      ...category,
      subcategories: children.map(buildHierarchy)
    };
  };
  
  return rootCategories.map(buildHierarchy);
};
