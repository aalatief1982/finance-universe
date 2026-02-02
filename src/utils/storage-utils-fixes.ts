
import { Transaction, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const getBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

// These are wrapper functions to fix issues with type compatibility
// They ensure that required properties are added before calling the original storage functions

export const validateTransactionForStorage = (transaction: unknown): Transaction => {
  const record = isRecord(transaction) ? transaction : {};
  const amountValue =
    typeof record.amount === 'number' && !Number.isNaN(record.amount)
      ? record.amount
      : 0;
  const resolvedType =
    record.type === 'income' || record.type === 'expense' || record.type === 'transfer'
      ? record.type
      : amountValue >= 0
        ? 'income'
        : 'expense';

  // Create a new object to avoid mutating the input
  const validatedTransaction: Transaction = {
    // Required fields with defaults
    id: getString(record.id) || '',
    title: getString(record.title) || 'Untitled Transaction',
    amount:
      amountValue,
    category: getString(record.category) || 'Uncategorized',
    date: getString(record.date) || new Date().toISOString(),
    type: resolvedType,
    source: record.source === 'manual' || record.source === 'import' || record.source === 'sms' || record.source === 'telegram'
      ? record.source
      : 'manual',
    fromAccount: getString(record.fromAccount) || (resolvedType !== 'income' ? 'Main Account' : undefined)
  };
  
  // Optional fields
  if (getString(record.subcategory)) validatedTransaction.subcategory = getString(record.subcategory);
  if (getString(record.notes)) validatedTransaction.notes = getString(record.notes);
  if (getString(record.currency)) validatedTransaction.currency = getString(record.currency);
  if (getString(record.person)) validatedTransaction.person = getString(record.person);
  if (getString(record.toAccount)) validatedTransaction.toAccount = getString(record.toAccount);
  if (getString(record.country)) validatedTransaction.country = getString(record.country);
  if (getString(record.description)) validatedTransaction.description = getString(record.description);
  if (getString(record.originalCurrency)) validatedTransaction.originalCurrency = getString(record.originalCurrency);
  
  // Convert any smsDetails to the details.sms format
  if (isRecord(record.smsDetails)) {
    validatedTransaction.details = {
      sms: {
        sender: getString(record.smsDetails.sender) || '',
        message: getString(record.smsDetails.message) || '',
        timestamp: getString(record.smsDetails.timestamp) || new Date().toISOString()
      }
    };
  } else if (isRecord(record.details)) {
    validatedTransaction.details = record.details as Transaction['details'];
  }
  
  // Ensure ID is present
  if (!validatedTransaction.id) {
    throw new Error('Transaction must have an ID');
  }
  
  return validatedTransaction;
};

export const validateCategoryForStorage = (category: unknown): Category => {
  const record = isRecord(category) ? category : {};
  // Create a new object to avoid mutating the input
  const validatedCategory: Category = {
    // Required fields with defaults
    id: getString(record.id) || '',
    name: getString(record.name) || 'Uncategorized'
  };
  
  // Optional fields
  if (getString(record.parentId)) validatedCategory.parentId = getString(record.parentId);
  if (isRecord(record.metadata)) validatedCategory.metadata = record.metadata as unknown as Category['metadata'];
  if (Array.isArray(record.subcategories)) validatedCategory.subcategories = record.subcategories as Category[];
  if (getBoolean(record.user) !== undefined) validatedCategory.user = getBoolean(record.user);
  
  // Ensure ID is present
  if (!validatedCategory.id) {
    throw new Error('Category must have an ID');
  }
  
  return validatedCategory;
};

export const validateCategoryRuleForStorage = (rule: unknown): CategoryRule => {
  const record = isRecord(rule) ? rule : {};
  // Create a new object to avoid mutating the input
  const validatedRule: CategoryRule = {
    // Required fields with defaults
    id: getString(record.id) || '',
    pattern: getString(record.pattern) || '',
    categoryId: getString(record.categoryId) || '',
    priority: typeof record.priority === 'number' ? record.priority : 0
  };
  
  // Optional fields
  if (getString(record.description)) validatedRule.description = getString(record.description);
  if (getBoolean(record.isRegex) !== undefined) validatedRule.isRegex = getBoolean(record.isRegex);
  
  // Ensure required fields are present
  if (!validatedRule.id) {
    throw new Error('Category rule must have an ID');
  }
  
  if (!validatedRule.categoryId) {
    throw new Error('Category rule must have a category ID');
  }
  
  return validatedRule;
};

export const validateCategoryChangeForStorage = (change: unknown): TransactionCategoryChange => {
  const record = isRecord(change) ? change : {};
  // Create a new object to avoid mutating the input
  const validatedChange: TransactionCategoryChange = {
    // Required fields with defaults
    transactionId: getString(record.transactionId) || '',
    newCategoryId: getString(record.newCategoryId) || '',
    timestamp: getString(record.timestamp) || new Date().toISOString()
  };
  
  // Optional fields
  if (getString(record.oldCategoryId)) validatedChange.oldCategoryId = getString(record.oldCategoryId);
  
  // Ensure required fields are present
  if (!validatedChange.transactionId) {
    throw new Error('Transaction category change must have a transaction ID');
  }
  
  if (!validatedChange.newCategoryId) {
    throw new Error('Transaction category change must have a new category ID');
  }
  
  return validatedChange;
};
