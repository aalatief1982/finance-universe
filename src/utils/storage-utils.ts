import { Transaction, TransactionSummary, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { validateTransactionForStorage, validateCategoryForStorage, validateCategoryRuleForStorage, validateCategoryChangeForStorage } from './storage-utils-fixes';
import { UserPreferences } from '@/types/user';
import { SupportedCurrency, LocaleSettings } from '@/types/locale';
import { StructureTemplateEntry } from '@/types/template';
import { extractTemplateStructure } from '@/lib/smart-paste-engine/templateUtils';
import { getAllTemplates } from '@/lib/smart-paste-engine/templateUtils';
import { saveNewTemplate } from '@/lib/smart-paste-engine/templateUtils';
import { loadKeywordBank,saveKeywordBank } from '@/lib/smart-paste-engine/keywordBankUtils';
import { loadTemplateBank, saveTemplateBank } from '@/lib/smart-paste-engine/templateUtils';
// Storage keys for local storage
const TRANSACTIONS_STORAGE_KEY = 'xpensia_transactions';
const CATEGORIES_STORAGE_KEY = 'xpensia_categories';
const CATEGORY_RULES_STORAGE_KEY = 'xpensia_category_rules';
const CATEGORY_CHANGES_STORAGE_KEY = 'xpensia_category_changes';
const USER_SETTINGS_STORAGE_KEY = 'xpensia_user_settings';
const LOCALE_SETTINGS_STORAGE_KEY = 'xpensia_locale_settings';
const STRUCTURE_KEY = 'xpensia_structure_templates';


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

export const saveStructureTemplate = (template: StructureTemplateEntry) => {
  const current = getStructureTemplates();
  current.unshift(template);
  localStorage.setItem(STRUCTURE_KEY, JSON.stringify(current.slice(0, 50)));
};

export const getStructureTemplates = (): StructureTemplateEntry[] => {
  try {
    const stored = localStorage.getItem(STRUCTURE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
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


export function updateTransaction(txn: Transaction) {
  const existing = JSON.parse(localStorage.getItem('xpensia_transactions') || '[]');
  const updated = existing.map((t: Transaction) => t.id === txn.id ? txn : t);
  localStorage.setItem('xpensia_transactions', JSON.stringify(updated));
}

export function learnFromTransaction(
  rawMessage: string,
  txn: Transaction,
  senderHint: string = ''
) {
  const { template, placeholders } = extractTemplateStructure(rawMessage);
  const fields = Object.keys(placeholders);
  const templateHash = btoa(unescape(encodeURIComponent(template))).slice(0, 24);

  const existingTemplates = getAllTemplates();
  const alreadyExists = existingTemplates.some(t => t.id === templateHash);
  if (!alreadyExists) {
    saveNewTemplate(template, fields, rawMessage);
  }

  // Save Keyword Mapping (Vendor → Category/Subcategory)
  if (txn.vendor && txn.category) {
    const keyword = placeholders?.vendor?.toLowerCase() || txn.vendor.toLowerCase();
    const bank = loadKeywordBank();
    const existing = bank.find(k => k.keyword === keyword);

    const newMappings = [
      { field: 'category', value: txn.category },
      { field: 'subcategory', value: txn.subcategory || 'none' }
    ];

    if (existing) {
      newMappings.forEach(mapping => {
        const exists = existing.mappings.some((m: any) => m.field === mapping.field && m.value === mapping.value);
        if (!exists) existing.mappings.push(mapping);
      });
    } else {
      bank.push({ keyword, mappings: newMappings });
    }

    saveKeywordBank(bank);
  }

  // Save Vendor Map if mismatch detected
  if (
    placeholders?.vendor &&
    txn.vendor &&
    placeholders.vendor !== txn.vendor
  ) {
    const vendorMap = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
    vendorMap[placeholders.vendor] = txn.vendor;
    localStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
  }

  // Save Template Hash → From Account mapping
  if (templateHash && txn.fromAccount) {
    const templates = loadTemplateBank();
    const t = templates.find(t => t.id === templateHash);
    if (t && !t.defaultValues?.fromAccount) {
      t.defaultValues = {
        ...t.defaultValues,
        fromAccount: txn.fromAccount
      };
      saveTemplateBank(templates);
    }
  }

  console.log('[Learned]', {
    templateHash,
    vendor: txn.vendor,
    category: txn.category,
    subcategory: txn.subcategory,
    fromAccount: txn.fromAccount,
    rawMessage
  });
}


export function addTransaction(txn: Transaction): void {
  try {
    const transactions = getStoredTransactions();

    const exists = transactions.some(t => t.id === txn.id);
    if (!exists) {
      transactions.unshift(txn); // insert at the beginning
      storeTransactions(transactions);
    }
  } catch (error) {
    console.error('[StorageUtils] Failed to add transaction:', error);
  }
}

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

// User settings storage functions
export const getUserSettings = (): UserPreferences => {
  return getFromStorage<UserPreferences>(USER_SETTINGS_STORAGE_KEY, {
    currency: 'USD',
    language: 'en',
    theme: 'light',
    notifications: {
      enabled: true,
      types: ['sms', 'budget', 'insights']
    },
    displayOptions: {
      showCents: true,
      weekStartsOn: 'sunday',
      defaultView: 'list',
      compactMode: false,
      showCategories: true,
      showTags: true
    },
    privacy: {
      maskAmounts: false,
      requireAuthForSensitiveActions: true,
      dataSharing: 'none'
    },
    dataManagement: {
      autoBackup: false,
      backupFrequency: 'weekly',
      dataRetention: 'forever'
    }
  });
};

export const storeUserSettings = (settings: UserPreferences): void => {
  setInStorage(USER_SETTINGS_STORAGE_KEY, settings);
};

// Locale settings storage functions
export const getLocaleSettings = (): LocaleSettings => {
  return getFromStorage<LocaleSettings>(LOCALE_SETTINGS_STORAGE_KEY, {
    locale: 'en-US',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    firstDayOfWeek: 0,
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  });
};

export const storeLocaleSettings = (settings: LocaleSettings): void => {
  setInStorage(LOCALE_SETTINGS_STORAGE_KEY, settings);
};

// Currency update function
export const updateCurrency = (currency: SupportedCurrency): void => {
  // Update in user settings
  const userSettings = getUserSettings();
  storeUserSettings({
    ...userSettings,
    currency
  });
  
  // Update in locale settings
  const localeSettings = getLocaleSettings();
  storeLocaleSettings({
    ...localeSettings,
    currency
  });
};

// New function to check if a transaction from SMS already exists
export function checkSmsTransactionExists(messageId: string): boolean {
  try {
    const transactions = getStoredTransactions();
    
    // Check if any transaction has this message ID in its details
    return transactions.some(txn => 
      txn.source === 'sms-import' && 
      txn.details?.messageId === messageId
    );
  } catch (error) {
    console.error('[StorageUtils] Failed to check SMS transaction existence:', error);
    return false;
  }
}

export { getFromStorage, setInStorage as saveToStorage };
