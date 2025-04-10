
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
import { User, UserPreferences } from "@/types/user";
import { LocaleSettings, SupportedCurrency } from "@/types/locale";
import { 
  validateTransactionForStorage, 
  validateCategoryForStorage, 
  validateCategoryRuleForStorage,
  validateCategoryChangeForStorage
} from "@/utils/storage-utils-fixes";

// Storage keys
const TRANSACTIONS_STORAGE_KEY = 'transactions';
const CATEGORIES_STORAGE_KEY = 'categories';
const CATEGORY_RULES_STORAGE_KEY = 'categoryRules';
const CATEGORY_CHANGES_STORAGE_KEY = 'categoryChanges';
const USER_PREFERENCES_STORAGE_KEY = 'userPreferences';
const USER_SETTINGS_STORAGE_KEY = 'userSettings';
const USER_PROFILE_STORAGE_KEY = 'userProfile';
const LOCALE_SETTINGS_STORAGE_KEY = 'localeSettings';
const BUDGETS_STORAGE_KEY = 'budgets';
const DATA_VERSION_KEY = 'dataVersion';
const USER_SESSION_KEY = 'userSession';
const USER_THEME_KEY = 'userTheme';

// Current data version - increment when data structure changes
const CURRENT_DATA_VERSION = '1.1';

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
        // No need for type casting now
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

export const storeTransaction = (transaction: any): void => {
  try {
    // Use the validation function to ensure the transaction has all required fields
    const validatedTransaction = validateTransactionForStorage(transaction);
    
    const transactions = getStoredTransactions();
    const existingIndex = transactions.findIndex(t => t.id === validatedTransaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = validatedTransaction;
    } else {
      transactions.unshift(validatedTransaction);
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

export const storeCategory = (category: any): void => {
  try {
    // Use the validation function to ensure the category has all required fields
    const validatedCategory = validateCategoryForStorage(category);
    
    const categories = getStoredCategories();
    const existingIndex = categories.findIndex(c => c.id === validatedCategory.id);
    
    if (existingIndex >= 0) {
      categories[existingIndex] = validatedCategory;
    } else {
      categories.push(validatedCategory);
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

export const storeCategoryRule = (rule: any): void => {
  try {
    // Use the validation function to ensure the rule has all required fields
    const validatedRule = validateCategoryRuleForStorage(rule);
    
    const rules = getStoredCategoryRules();
    const existingIndex = rules.findIndex(r => r.id === validatedRule.id);
    
    if (existingIndex >= 0) {
      rules[existingIndex] = validatedRule;
    } else {
      rules.push(validatedRule);
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

export const addCategoryChange = (change: any): void => {
  try {
    // Use the validation function to ensure the change has all required fields
    const validatedChange = validateCategoryChangeForStorage(change);
    
    const changes = getStoredCategoryChanges();
    changes.push(validatedChange);
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

// New function: Get comprehensive user settings
export const getUserSettings = (): UserPreferences => {
  try {
    const storedSettings = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    if (!storedSettings) {
      // Return default settings if none exist
      return {
        currency: 'USD',
        language: 'en',
        theme: 'system',
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
      };
    }
    
    const parsedSettings = JSON.parse(storedSettings);
    
    // Make sure all required properties exist
    const defaultSettings: UserPreferences = {
      currency: parsedSettings.currency || 'USD',
      language: parsedSettings.language || 'en',
      theme: parsedSettings.theme || 'system',
      notifications: {
        enabled: parsedSettings.notifications?.enabled !== false,
        types: parsedSettings.notifications?.types || ['sms', 'budget', 'insights']
      },
      displayOptions: {
        showCents: parsedSettings.displayOptions?.showCents !== false,
        weekStartsOn: parsedSettings.displayOptions?.weekStartsOn || 'sunday', 
        defaultView: parsedSettings.displayOptions?.defaultView || 'list',
        compactMode: parsedSettings.displayOptions?.compactMode === true,
        showCategories: parsedSettings.displayOptions?.showCategories !== false,
        showTags: parsedSettings.displayOptions?.showTags !== false
      },
      privacy: {
        maskAmounts: parsedSettings.privacy?.maskAmounts === true,
        requireAuthForSensitiveActions: parsedSettings.privacy?.requireAuthForSensitiveActions !== false,
        dataSharing: parsedSettings.privacy?.dataSharing || 'none'
      },
      dataManagement: {
        autoBackup: parsedSettings.dataManagement?.autoBackup === true,
        backupFrequency: parsedSettings.dataManagement?.backupFrequency || 'weekly',
        dataRetention: parsedSettings.dataManagement?.dataRetention || 'forever'
      }
    };
    
    return defaultSettings;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load user settings from storage',
      originalError: error
    });
    
    // Return default settings in case of error
    return {
      currency: 'USD',
      language: 'en',
      theme: 'system',
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
    };
  }
};

// New function: Store comprehensive user settings
export const storeUserSettings = (settings: UserPreferences): void => {
  try {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    
    // Also update theme in a separate key for quick access
    if (settings.theme) {
      localStorage.setItem(USER_THEME_KEY, settings.theme);
    }
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save user settings to storage',
      originalError: error
    });
  }
};

// New function: Update specific user setting
export const updateUserSetting = <T extends keyof UserPreferences>(
  key: T, 
  value: UserPreferences[T]
): void => {
  try {
    const currentSettings = getUserSettings();
    const updatedSettings = {
      ...currentSettings,
      [key]: value
    };
    
    storeUserSettings(updatedSettings);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: `Failed to update user setting: ${String(key)}`,
      originalError: error
    });
  }
};

// New function: Get user profile
export const getUserProfile = (): User | null => {
  try {
    const storedProfile = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!storedProfile) {
      return null;
    }
    
    const parsedProfile = JSON.parse(storedProfile);
    
    // Convert date strings back to Date objects
    if (parsedProfile.birthDate) {
      parsedProfile.birthDate = new Date(parsedProfile.birthDate);
    }
    if (parsedProfile.createdAt) {
      parsedProfile.createdAt = new Date(parsedProfile.createdAt);
    }
    if (parsedProfile.lastActive) {
      parsedProfile.lastActive = new Date(parsedProfile.lastActive);
    }
    
    return parsedProfile as User;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load user profile from storage',
      originalError: error
    });
    return null;
  }
};

// New function: Store user profile
export const storeUserProfile = (profile: User): void => {
  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save user profile to storage',
      originalError: error
    });
  }
};

// New function: Update specific user profile field
export const updateUserProfile = (updates: Partial<User>): void => {
  try {
    const currentProfile = getUserProfile();
    if (!currentProfile) {
      // If no profile exists, create a new one with the updates
      if (updates.id) {
        storeUserProfile({
          id: updates.id,
          fullName: updates.fullName || '',
          phone: updates.phone || '',
          phoneVerified: updates.phoneVerified || false,
          gender: updates.gender || null,
          birthDate: updates.birthDate || null,
          hasProfile: updates.hasProfile || false,
          smsProviders: updates.smsProviders || [],
          completedOnboarding: updates.completedOnboarding || false,
          ...updates
        });
      }
      return;
    }
    
    // Update existing profile
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      lastActive: new Date()
    };
    
    storeUserProfile(updatedProfile);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to update user profile in storage',
      originalError: error
    });
  }
};

// New function: Get locale settings
export const getLocaleSettings = (): LocaleSettings => {
  try {
    const storedSettings = localStorage.getItem(LOCALE_SETTINGS_STORAGE_KEY);
    if (!storedSettings) {
      // Return default locale settings
      return {
        locale: 'en-US',
        currency: 'USD',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'h:mm a',
        firstDayOfWeek: 0
      };
    }
    
    return JSON.parse(storedSettings);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load locale settings from storage',
      originalError: error
    });
    
    // Return default settings in case of error
    return {
      locale: 'en-US',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: 'h:mm a',
      firstDayOfWeek: 0
    };
  }
};

// New function: Store locale settings
export const storeLocaleSettings = (settings: LocaleSettings): void => {
  try {
    localStorage.setItem(LOCALE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save locale settings to storage',
      originalError: error
    });
  }
};

// New function: Update currency
export const updateCurrency = (currency: SupportedCurrency): void => {
  try {
    // Update in locale settings
    const localeSettings = getLocaleSettings();
    storeLocaleSettings({
      ...localeSettings,
      currency
    });
    
    // Update in user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      currency
    });
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to update currency in storage',
      originalError: error
    });
  }
};

// New function: Get theme
export const getUserTheme = (): 'light' | 'dark' | 'system' => {
  try {
    const theme = localStorage.getItem(USER_THEME_KEY);
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme;
    }
    return 'system';
  } catch (error) {
    console.warn('Failed to get user theme from storage', error);
    return 'system';
  }
};

// New function: Store user session
export const storeUserSession = (session: { userId: string, token: string, expiresAt: number }): void => {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save user session to storage',
      originalError: error
    });
  }
};

// New function: Get user session
export const getUserSession = (): { userId: string, token: string, expiresAt: number } | null => {
  try {
    const storedSession = localStorage.getItem(USER_SESSION_KEY);
    if (!storedSession) {
      return null;
    }
    
    const session = JSON.parse(storedSession);
    
    // Check if session is expired
    if (session.expiresAt && session.expiresAt < Date.now()) {
      localStorage.removeItem(USER_SESSION_KEY);
      return null;
    }
    
    return session;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load user session from storage',
      originalError: error
    });
    return null;
  }
};

// New function: Clear user session
export const clearUserSession = (): void => {
  try {
    localStorage.removeItem(USER_SESSION_KEY);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to clear user session from storage',
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
      userSettings: getUserSettings(),
      localeSettings: getLocaleSettings(),
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
    
    if (backup.userSettings) {
      storeUserSettings(backup.userSettings);
    }
    
    if (backup.localeSettings) {
      storeLocaleSettings(backup.localeSettings);
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
    localStorage.removeItem(USER_SETTINGS_STORAGE_KEY);
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    localStorage.removeItem(LOCALE_SETTINGS_STORAGE_KEY);
    localStorage.removeItem(BUDGETS_STORAGE_KEY);
    localStorage.removeItem(DATA_VERSION_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(USER_THEME_KEY);
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to clear all data from storage',
      originalError: error
    });
  }
};
