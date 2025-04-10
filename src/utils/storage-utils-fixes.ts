
import { Transaction, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction';

// These are wrapper functions to fix issues with type compatibility
// They ensure that required properties are added before calling the original storage functions

export const validateTransactionForStorage = (transaction: any): Transaction => {
  // Ensure the transaction has all required fields
  if (!transaction.id) {
    throw new Error('Transaction must have an ID');
  }
  
  if (transaction.source !== 'manual' && transaction.source !== 'import' && transaction.source !== 'sms') {
    transaction.source = 'manual';
  }

  // Ensure type is a valid TransactionType
  if (transaction.type !== 'income' && transaction.type !== 'expense' && transaction.type !== 'transfer') {
    transaction.type = transaction.amount >= 0 ? 'income' : 'expense';
  }
  
  // Convert any smsDetails to the details.sms format
  if (transaction.smsDetails && !transaction.details) {
    transaction.details = {
      sms: {
        sender: transaction.smsDetails.sender,
        message: transaction.smsDetails.message,
        timestamp: transaction.smsDetails.timestamp
      }
    };
    delete transaction.smsDetails;
  }
  
  return transaction as Transaction;
};

export const validateCategoryForStorage = (category: any): Category => {
  // Ensure the category has all required fields
  if (!category.id) {
    throw new Error('Category must have an ID');
  }
  
  // Ensure the category has a name
  if (!category.name) {
    category.name = 'Uncategorized';
  }
  
  return category as Category;
};

export const validateCategoryRuleForStorage = (rule: any): CategoryRule => {
  // Ensure the rule has all required fields
  if (!rule.id) {
    throw new Error('Category rule must have an ID');
  }
  
  if (!rule.pattern) {
    rule.pattern = '';
  }
  
  if (!rule.categoryId) {
    throw new Error('Category rule must have a category ID');
  }
  
  if (typeof rule.priority !== 'number') {
    rule.priority = 0;
  }
  
  return rule as CategoryRule;
};

export const validateCategoryChangeForStorage = (change: any): TransactionCategoryChange => {
  // Ensure the change has all required fields
  if (!change.transactionId) {
    throw new Error('Transaction category change must have a transaction ID');
  }
  
  if (!change.newCategoryId) {
    throw new Error('Transaction category change must have a new category ID');
  }
  
  if (!change.timestamp) {
    change.timestamp = new Date().toISOString();
  }
  
  return change as TransactionCategoryChange;
};
