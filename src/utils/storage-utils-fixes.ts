
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
  
  return transaction as Transaction;
};

export const validateCategoryForStorage = (category: any): Category => {
  // Ensure the category has all required fields
  if (!category.id) {
    throw new Error('Category must have an ID');
  }
  
  return category as Category;
};

export const validateCategoryRuleForStorage = (rule: any): CategoryRule => {
  // Ensure the rule has all required fields
  if (!rule.id) {
    throw new Error('Category rule must have an ID');
  }
  
  return rule as CategoryRule;
};

export const validateCategoryChangeForStorage = (change: any): TransactionCategoryChange => {
  // Ensure the change has all required fields
  if (!change.transactionId) {
    throw new Error('Transaction category change must have a transaction ID');
  }
  
  return change as TransactionCategoryChange;
};
