
import { v4 as uuidv4 } from 'uuid';
import { 
  Transaction, 
  Category, 
  CategoryRule, 
  CategoryWithSubcategories,
  TransactionCategoryChange 
} from '@/types/transaction';

// Constants
const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  CATEGORY_RULES: 'categoryRules',
  CATEGORY_CHANGES: 'categoryChanges'
};

// Transaction Storage Functions
export const getStoredTransactions = (): Transaction[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!storedData) return [];
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving transactions from storage:', error);
    return [];
  }
};

export const storeTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error storing transactions:', error);
  }
};

export const storeTransaction = (transaction: Transaction): void => {
  try {
    const transactions = getStoredTransactions();
    
    // Update existing or add new
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) {
      transactions[index] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    storeTransactions(transactions);
  } catch (error) {
    console.error('Error storing transaction:', error);
  }
};

export const removeTransaction = (id: string): void => {
  try {
    const transactions = getStoredTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    storeTransactions(filtered);
  } catch (error) {
    console.error('Error removing transaction:', error);
  }
};

// Category Storage Functions
export const getStoredCategories = (): Category[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!storedData) return [];
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving categories from storage:', error);
    return [];
  }
};

export const storeCategories = (categories: Category[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error storing categories:', error);
  }
};

export const getCategoryHierarchy = (): CategoryWithSubcategories[] => {
  // This would typically build a hierarchy from flat categories
  // For now, return a simple mock hierarchy
  return [
    {
      id: 'income',
      name: 'Income',
      subcategories: [
        { id: 'salary', name: 'Salary', parentId: 'income' },
        { id: 'investments', name: 'Investments', parentId: 'income' }
      ]
    },
    {
      id: 'expenses',
      name: 'Expenses',
      subcategories: [
        { id: 'groceries', name: 'Groceries', parentId: 'expenses' },
        { id: 'dining', name: 'Dining', parentId: 'expenses' },
        { id: 'utilities', name: 'Utilities', parentId: 'expenses' }
      ]
    }
  ];
};

// Category Rules Functions
export const getStoredCategoryRules = (): CategoryRule[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.CATEGORY_RULES);
    if (!storedData) return [];
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving category rules from storage:', error);
    return [];
  }
};

export const addCategoryChange = (change: TransactionCategoryChange): void => {
  try {
    const changes = getStoredCategoryChanges();
    changes.push({...change, timestamp: new Date().toISOString()});
    
    localStorage.setItem(STORAGE_KEYS.CATEGORY_CHANGES, JSON.stringify(changes));
  } catch (error) {
    console.error('Error storing category change:', error);
  }
};

export const getStoredCategoryChanges = (): TransactionCategoryChange[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.CATEGORY_CHANGES);
    if (!storedData) return [];
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving category changes from storage:', error);
    return [];
  }
};
