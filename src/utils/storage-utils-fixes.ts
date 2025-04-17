
import { Transaction, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction.d';

// These are wrapper functions to fix issues with type compatibility
// They ensure that required properties are added before calling the original storage functions

export const validateTransactionForStorage = (transaction: any): Transaction => {
  // Create a new object to avoid mutating the input
  const validatedTransaction: Transaction = {
    // Required fields with defaults
    id: transaction.id || '',
    title: transaction.title || 'Untitled Transaction',
    amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
    category: transaction.category || 'Uncategorized',
    date: transaction.date || new Date().toISOString(),
    type: transaction.type === 'income' || transaction.type === 'expense' || transaction.type === 'transfer' 
      ? transaction.type 
      : (transaction.amount >= 0 ? 'income' : 'expense'),
    source: transaction.source === 'manual' || transaction.source === 'import' || transaction.source === 'sms' || transaction.source === 'telegram'
      ? transaction.source 
      : 'manual',
    fromAccount: transaction.fromAccount || 'Main Account'
  };
  
  // Optional fields
  if (transaction.subcategory) validatedTransaction.subcategory = transaction.subcategory;
  if (transaction.notes) validatedTransaction.notes = transaction.notes;
  if (transaction.currency) validatedTransaction.currency = transaction.currency;
  if (transaction.person) validatedTransaction.person = transaction.person;
  if (transaction.toAccount) validatedTransaction.toAccount = transaction.toAccount;
  if (transaction.country) validatedTransaction.country = transaction.country;
  if (transaction.description) validatedTransaction.description = transaction.description;
  if (transaction.originalCurrency) validatedTransaction.originalCurrency = transaction.originalCurrency;
  
  // Convert any smsDetails to the details.sms format
  if (transaction.smsDetails) {
    validatedTransaction.details = {
      sms: {
        sender: transaction.smsDetails.sender || '',
        message: transaction.smsDetails.message || '',
        timestamp: transaction.smsDetails.timestamp || new Date().toISOString()
      }
    };
  } else if (transaction.details) {
    validatedTransaction.details = transaction.details;
  }
  
  // Ensure ID is present
  if (!validatedTransaction.id) {
    throw new Error('Transaction must have an ID');
  }
  
  return validatedTransaction;
};

export const validateCategoryForStorage = (category: any): Category => {
  // Create a new object to avoid mutating the input
  const validatedCategory: Category = {
    // Required fields with defaults
    id: category.id || '',
    name: category.name || 'Uncategorized'
  };
  
  // Optional fields
  if (category.parentId) validatedCategory.parentId = category.parentId;
  if (category.metadata) validatedCategory.metadata = category.metadata;
  if (category.subcategories) validatedCategory.subcategories = category.subcategories;
  
  // Ensure ID is present
  if (!validatedCategory.id) {
    throw new Error('Category must have an ID');
  }
  
  return validatedCategory;
};

export const validateCategoryRuleForStorage = (rule: any): CategoryRule => {
  // Create a new object to avoid mutating the input
  const validatedRule: CategoryRule = {
    // Required fields with defaults
    id: rule.id || '',
    pattern: rule.pattern || '',
    categoryId: rule.categoryId || '',
    priority: typeof rule.priority === 'number' ? rule.priority : 0
  };
  
  // Optional fields
  if (rule.description) validatedRule.description = rule.description;
  if (typeof rule.isRegex === 'boolean') validatedRule.isRegex = rule.isRegex;
  
  // Ensure required fields are present
  if (!validatedRule.id) {
    throw new Error('Category rule must have an ID');
  }
  
  if (!validatedRule.categoryId) {
    throw new Error('Category rule must have a category ID');
  }
  
  return validatedRule;
};

export const validateCategoryChangeForStorage = (change: any): TransactionCategoryChange => {
  // Create a new object to avoid mutating the input
  const validatedChange: TransactionCategoryChange = {
    // Required fields with defaults
    transactionId: change.transactionId || '',
    newCategoryId: change.newCategoryId || '',
    timestamp: change.timestamp || new Date().toISOString()
  };
  
  // Optional fields
  if (change.oldCategoryId) validatedChange.oldCategoryId = change.oldCategoryId;
  
  // Ensure required fields are present
  if (!validatedChange.transactionId) {
    throw new Error('Transaction category change must have a transaction ID');
  }
  
  if (!validatedChange.newCategoryId) {
    throw new Error('Transaction category change must have a new category ID');
  }
  
  return validatedChange;
};
