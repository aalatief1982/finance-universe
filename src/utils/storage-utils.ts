
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
  CATEGORY_CHANGES: 'categoryChanges',
  USER_SETTINGS: 'userSettings',
  LOCALE_SETTINGS: 'localeSettings'
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

// Add the missing storeCategoryRules function
export const storeCategoryRules = (rules: CategoryRule[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORY_RULES, JSON.stringify(rules));
  } catch (error) {
    console.error('Error storing category rules:', error);
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

// Add the missing storeCategoryChanges function
export const storeCategoryChanges = (changes: TransactionCategoryChange[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORY_CHANGES, JSON.stringify(changes));
  } catch (error) {
    console.error('Error storing category changes:', error);
  }
};

// User Settings Functions
export const getUserSettings = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (!storedData) {
      return {
        theme: 'system',
        currency: 'USD',
        language: 'en-US',
        notifications: true,
        displayOptions: {
          showCents: true,
          weekStartsOn: 'sunday',
          defaultView: 'list',
          compactMode: false,
          showCategories: true,
          showTags: false
        },
        privacy: {
          maskAmounts: false,
          requireAuthForSensitiveActions: false,
          dataSharing: 'anonymous'
        },
        dataManagement: {
          autoBackup: false,
          backupFrequency: 'weekly',
          dataRetention: '1year'
        }
      };
    }
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving user settings from storage:', error);
    return {
      theme: 'system',
      currency: 'USD',
      language: 'en-US',
      notifications: true
    };
  }
};

export const storeUserSettings = (settings: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error storing user settings:', error);
  }
};

export const updateCurrency = (currency: string): void => {
  try {
    const settings = getUserSettings();
    settings.currency = currency;
    storeUserSettings(settings);
  } catch (error) {
    console.error('Error updating currency setting:', error);
  }
};

// Locale Settings Functions
export const getLocaleSettings = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.LOCALE_SETTINGS);
    if (!storedData) {
      return {
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        firstDayOfWeek: 0, // Sunday
        numberFormat: {
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 2
        }
      };
    }
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving locale settings from storage:', error);
    return {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      firstDayOfWeek: 0
    };
  }
};

export const storeLocaleSettings = (settings: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCALE_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error storing locale settings:', error);
  }
};
