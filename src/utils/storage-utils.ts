import { safeStorage } from "@/utils/safe-storage";
import { Transaction, TransactionSummary, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { validateTransactionForStorage, validateCategoryForStorage, validateCategoryRuleForStorage, validateCategoryChangeForStorage } from './storage-utils-fixes';
import { UserPreferences } from '@/types/user';
import { SupportedCurrency, LocaleSettings } from '@/types/locale';
import { StructureTemplateEntry } from '@/types/template';
import { extractTemplateStructure, getAllTemplates, saveNewTemplate, loadTemplateBank, saveTemplateBank, getTemplateKey } from '@/lib/smart-paste-engine/templateUtils';
import { loadKeywordBank, saveKeywordBank, KeywordEntry } from '@/lib/smart-paste-engine/keywordBankUtils';
// Storage keys for local storage
const TRANSACTIONS_STORAGE_KEY = 'xpensia_transactions';
const CATEGORIES_STORAGE_KEY = 'xpensia_categories';
const CATEGORY_RULES_STORAGE_KEY = 'xpensia_category_rules';
const CATEGORY_CHANGES_STORAGE_KEY = 'xpensia_category_changes';
const USER_SETTINGS_STORAGE_KEY = 'xpensia_user_settings';
const LOCALE_SETTINGS_STORAGE_KEY = 'xpensia_locale_settings';
const STRUCTURE_KEY = 'xpensia_structure_templates';
const SMS_SENDER_IMPORT_MAP_KEY = 'xpensia_sms_sender_import_map';


// Helper function to safely get data from storage
// Fallbacks to in-memory storage handled by safeStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const storedData = safeStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error(`Error retrieving ${key} from storage:`, error);
    }
    return defaultValue;
  }
};

// Helper function to safely set data in localStorage
const setInStorage = <T>(key: string, data: T): void => {
  try {
    safeStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error(`Error storing ${key} in storage:`, error);
    }
  }
};

/**
 * Attempts to persist a value in localStorage.
 * Returns true on success and false if an error occurred
 * (e.g. QuotaExceededError).
 */
export const safeSetItem = <T>(key: string, data: T): boolean => {
  try {
    safeStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error: any) {
    if (import.meta.env.MODE === 'development') {
      console.error(`Error storing ${key} in storage:`, error);
    }
    return false;
  }
};

// Transactions storage functions
export const getStoredTransactions = (): Transaction[] => {
  return getFromStorage<Transaction[]>(TRANSACTIONS_STORAGE_KEY, []);
};

export const storeTransactions = (transactions: Transaction[]): void => {
  setInStorage(TRANSACTIONS_STORAGE_KEY, transactions);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: TRANSACTIONS_STORAGE_KEY,
        newValue: JSON.stringify(transactions)
      })
    );
  }
};

export const saveStructureTemplate = (template: StructureTemplateEntry) => {
  const current = getStructureTemplates();
  current.unshift(template);
  safeStorage.setItem(STRUCTURE_KEY, JSON.stringify(current.slice(0, 50)));
};

export const getStructureTemplates = (): StructureTemplateEntry[] => {
  try {
    const stored = safeStorage.getItem(STRUCTURE_KEY);
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
    if (import.meta.env.MODE === 'development') {
      console.error('Error storing transaction:', error);
    }
    throw error;
  }
};


export function updateTransaction(txn: Transaction) {
  const existing = JSON.parse(safeStorage.getItem('xpensia_transactions') || '[]');
  const updated = existing.map((t: Transaction) => t.id === txn.id ? txn : t);
  safeStorage.setItem('xpensia_transactions', JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: TRANSACTIONS_STORAGE_KEY,
        newValue: JSON.stringify(updated)
      })
    );
  }
}

export function learnFromTransaction(
  rawMessage: string,
  txn: Transaction,
  senderHint: string = ''
) {
  const { structure, placeholders, hash: templateHash } = extractTemplateStructure(rawMessage);
  const fields = Object.keys(placeholders);

  const key = getTemplateKey(senderHint, txn.fromAccount, templateHash);
  let bank = loadTemplateBank();
  if (!bank[key]) {
    saveNewTemplate(structure, fields, rawMessage, senderHint, txn.fromAccount);
    bank = loadTemplateBank();
  }

  const template = bank[key];
  if (template) {
    if (!template.meta) template.meta = {} as any;
    template.meta.usageCount = (template.meta.usageCount || 0) + 1;
    template.meta.lastUsedAt = new Date().toISOString();

    const toLower = (v?: string) => (v || '').toLowerCase().trim();
    const amtPlace = placeholders.amount
      ? parseFloat(placeholders.amount.replace(/,/g, ''))
      : undefined;
    const amtTxn = txn.amount !== undefined ? parseFloat(String(txn.amount)) : undefined;

    const isVendorMatch = placeholders.vendor
      ? toLower(placeholders.vendor) === toLower(txn.vendor)
      : true;
    const isCurrencyMatch = placeholders.currency
      ? toLower(placeholders.currency) === toLower(txn.currency)
      : true;
    const isAccountMatch = placeholders.account
      ? toLower(placeholders.account) === toLower(txn.fromAccount)
      : true;
    const isAmountMatch =
      amtPlace !== undefined && amtTxn !== undefined
        ? amtPlace === amtTxn
        : true;

    const isSuccess = isVendorMatch && isCurrencyMatch && isAccountMatch && isAmountMatch;

    template.meta.successCount = template.meta.successCount ?? 0;
    template.meta.fallbackCount = template.meta.fallbackCount ?? 0;
    if (isSuccess) {
      template.meta.successCount += 1;
    } else {
      template.meta.fallbackCount += 1;
    }

    bank[key] = template;
    saveTemplateBank(bank);
  }

  // Save Keyword Mapping (Vendor → Category/Subcategory)
  if (txn.vendor && txn.category) {
    const keyword = placeholders?.vendor?.toLowerCase() || txn.vendor.toLowerCase();
    const bank = loadKeywordBank();
    const existing = bank.find(k => k.keyword === keyword);

    const newMappings: KeywordEntry['mappings'] = [
      { field: 'category', value: txn.category },
      { field: 'subcategory', value: txn.subcategory || 'none' }
    ];

    if (existing) {
      newMappings.forEach(mapping => {
        const exists = existing.mappings.some((m: any) => m.field === mapping.field && m.value === mapping.value);
        if (!exists) existing.mappings.push(mapping);
      });
    } else {
      bank.push({ keyword, type: 'auto', mappings: newMappings });
    }

    saveKeywordBank(bank);
  }

  // Save Vendor Map if mismatch detected
  if (
    placeholders?.vendor &&
    txn.vendor &&
    placeholders.vendor !== txn.vendor
  ) {
    const vendorMap = JSON.parse(safeStorage.getItem('xpensia_vendor_map') || '{}');
    vendorMap[placeholders.vendor] = txn.vendor;
    safeStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
  }

  // Save Template Hash → From Account mapping
  if (templateHash && txn.fromAccount) {
    const templates = loadTemplateBank();
    const key = getTemplateKey(senderHint, txn.fromAccount, templateHash);
    const t = templates[key] || templates[getTemplateKey(senderHint, undefined, templateHash)];
    if (t && !t.defaultValues?.fromAccount) {
      t.defaultValues = {
        ...t.defaultValues,
        fromAccount: txn.fromAccount
      };
      saveTemplateBank(templates);
    }
  }

  if (import.meta.env.MODE === 'development') console.log('[Learned]', {
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
    if (import.meta.env.MODE === 'development') {
      console.error('[StorageUtils] Failed to add transaction:', error);
    }
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
    if (import.meta.env.MODE === 'development') {
      console.error('Error storing category:', error);
    }
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
    if (import.meta.env.MODE === 'development') {
      console.error('Error storing category rule:', error);
    }
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
    if (import.meta.env.MODE === 'development') {
      console.error('Error storing category change:', error);
    }
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
    },
    sms: {
      startDate: '',
      autoDetectProviders: false,
      showDetectionNotifications: false,
      autoImport: false,
      backgroundSmsEnabled: false,
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

export const getSelectedSmsSenders = (): string[] => {
  return Object.keys(getSmsSenderImportMap());
};

export const setSelectedSmsSenders = (senders: string[]): void => {
  const map = getSmsSenderImportMap();
  const defaultStart = new Date();
  defaultStart.setMonth(defaultStart.getMonth() - 6);
  senders.forEach(sender => {
    if (!map[sender]) {
      map[sender] = defaultStart.toISOString();
    }
  });
  setInStorage(SMS_SENDER_IMPORT_MAP_KEY, map);
};

export const getSmsSenderImportMap = (): Record<string, string> => {
  return getFromStorage<Record<string, string>>(SMS_SENDER_IMPORT_MAP_KEY, {});
};

export const setSmsSenderImportDate = (sender: string, date: string): void => {
  const map = getSmsSenderImportMap();
  map[sender] = date;
  setInStorage(SMS_SENDER_IMPORT_MAP_KEY, map);
};

export const updateSmsSenderImportDates = (updates: Record<string, string>): void => {
  const map = getSmsSenderImportMap();
  Object.entries(updates).forEach(([sender, date]) => {
    map[sender] = date;
  });
  setInStorage(SMS_SENDER_IMPORT_MAP_KEY, map);
};
