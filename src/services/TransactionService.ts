import { v4 as uuidv4 } from 'uuid';
import { Transaction, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction';
import { getStoredTransactions, storeTransactions, getStoredCategories, storeCategories, getStoredCategoryRules, storeCategoryRules, getStoredCategoryChanges, storeCategoryChanges } from '@/utils/storage-utils';
import { transactionAnalyticsService } from './TransactionAnalyticsService';
import { processSmsEntries } from './SmsProcessingService';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

class TransactionService {
  // Basic Transaction CRUD Operations

  // Get all transactions
  getAllTransactions(): Transaction[] {
    return getStoredTransactions();
  }

  // Save transactions
  saveTransactions(transactions: Transaction[]): void {
    storeTransactions(transactions);
  }

  // Add a new transaction
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction = {
      ...transaction,
      id: uuidv4()
    };
    
    // Auto-categorize if no category is provided
    if (!newTransaction.category) {
      newTransaction.category = this.suggestCategory(newTransaction);
    }
    
    const transactions = this.getAllTransactions();
    transactions.push(newTransaction);
    this.saveTransactions(transactions);
    
    // Log analytics event
    logAnalyticsEvent('transaction_add', {
      category: newTransaction.category,
      amount: newTransaction.amount,
      currency: newTransaction.currency
    });
    
    return newTransaction;
  }

  // Update an existing transaction
  updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id'>>): Transaction | null {
    const transactions = this.getAllTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const oldTransaction = transactions[index];
    const updatedTransaction = { ...oldTransaction, ...updates };
    transactions[index] = updatedTransaction;
    this.saveTransactions(transactions);
    
    // Record category change if category was updated
    if (updates.category && updates.category !== oldTransaction.category) {
      this.recordCategoryChange(id, oldTransaction.category, updates.category);
    }
    
    return updatedTransaction;
  }

  // Delete a transaction
  deleteTransaction(id: string): boolean {
    const transactions = this.getAllTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) {
      return false;
    }
    
    this.saveTransactions(filteredTransactions);
    
    // Log analytics event
    logAnalyticsEvent('transaction_delete', {
      transaction_id: id
    });
    
    return true;
  }

  // Process SMS messages to extract transactions (delegated to SmsProcessingService)
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    const entries = messages.map(msg => ({
      sender: msg.sender,
      message: msg.message,
      timestamp: msg.date.toISOString()
    }));
    return processSmsEntries(entries);
  }

  // Analytics Methods (delegated to TransactionAnalyticsService)

  // Get transactions summary statistics
  getTransactionsSummary() {
    return transactionAnalyticsService.getTransactionsSummary();
  }

  // Get transactions grouped by category
  getTransactionsByCategory() {
    return transactionAnalyticsService.getTransactionsByCategory();
  }

  // Get transactions grouped by time period
  getTransactionsByTimePeriod(period: 'week' | 'month' | 'year' = 'month') {
    return transactionAnalyticsService.getTransactionsByTimePeriod(period);
  }

  // Advanced Categorization Methods

  // Get all categories
  getCategories(): Category[] {
    return getStoredCategories();
  }

  // Save categories
  saveCategories(categories: Category[]): void {
    storeCategories(categories);
  }

  // Add a new category
  addCategory(category: Omit<Category, 'id'>): Category {
    const newCategory = {
      ...category,
      id: uuidv4(),
      user: true
    };
    
    const categories = this.getCategories();
    categories.push(newCategory);
    this.saveCategories(categories);
    
    return newCategory;
  }

  // Update an existing category
  updateCategory(id: string, updates: Partial<Omit<Category, 'id'>>): Category | null {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    const updatedCategory = { ...categories[index], ...updates };
    categories[index] = updatedCategory;
    this.saveCategories(categories);
    
    return updatedCategory;
  }

  // Delete a category
  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    
    // Check if this category has subcategories
    const hasSubcategories = categories.some(c => c.parentId === id);
    if (hasSubcategories) {
      return false; // Don't delete categories with subcategories
    }
    
    const filteredCategories = categories.filter(c => c.id !== id);
    
    if (filteredCategories.length === categories.length) {
      return false;
    }
    
    this.saveCategories(filteredCategories);
    
    // Re-categorize transactions that used this category
    const transactions = this.getAllTransactions();
    const updatedTransactions = transactions.map(t => {
      if (t.category === id) {
        // Find parent category if exists
        const deletedCategory = categories.find(c => c.id === id);
        const parentId = deletedCategory?.parentId;
        
        return {
          ...t,
          category: parentId || 'Uncategorized'
        };
      }
      return t;
    });
    
    this.saveTransactions(updatedTransactions);
    
    return true;
  }

  // Get category rules
  getCategoryRules(): CategoryRule[] {
    return getStoredCategoryRules();
  }

  // Save category rules
  saveCategoryRules(rules: CategoryRule[]): void {
    storeCategoryRules(rules);
  }

  // Add a new category rule
  addCategoryRule(rule: Omit<CategoryRule, 'id'>): CategoryRule {
    const newRule = {
      ...rule,
      id: uuidv4()
    };
    
    const rules = this.getCategoryRules();
    
    // Insert based on priority
    let inserted = false;
    for (let i = 0; i < rules.length; i++) {
      if (newRule.priority > rules[i].priority) {
        rules.splice(i, 0, newRule);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      rules.push(newRule);
    }
    
    this.saveCategoryRules(rules);
    
    return newRule;
  }

  // Update an existing rule
  updateCategoryRule(id: string, updates: Partial<Omit<CategoryRule, 'id'>>): CategoryRule | null {
    const rules = this.getCategoryRules();
    const index = rules.findIndex(r => r.id === id);
    
    if (index === -1) return null;
    
    const updatedRule = { ...rules[index], ...updates };
    rules.splice(index, 1); // Remove at current position
    
    // Re-insert based on priority
    let inserted = false;
    for (let i = 0; i < rules.length; i++) {
      if (updatedRule.priority > rules[i].priority) {
        rules.splice(i, 0, updatedRule);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      rules.push(updatedRule);
    }
    
    this.saveCategoryRules(rules);
    
    return updatedRule;
  }

  // Delete a category rule
  deleteCategoryRule(id: string): boolean {
    const rules = this.getCategoryRules();
    const filteredRules = rules.filter(r => r.id !== id);
    
    if (filteredRules.length === rules.length) {
      return false;
    }
    
    this.saveCategoryRules(filteredRules);
    return true;
  }

  // Apply category rules to all transactions
  applyAllCategoryRules(): number {
    const transactions = this.getAllTransactions();
    const rules = this.getCategoryRules();
    let changedCount = 0;
    
    const updatedTransactions = transactions.map(transaction => {
      const oldCategory = transaction.category;
      const newCategory = this.findMatchingCategoryByRules(transaction, rules);
      
      if (newCategory && newCategory !== oldCategory) {
        changedCount++;
        
        // Record category change
        this.recordCategoryChange(transaction.id, oldCategory, newCategory);
        
        return {
          ...transaction,
          category: newCategory
        };
      }
      
      return transaction;
    });
    
    this.saveTransactions(updatedTransactions);
    
    return changedCount;
  }

  // Record a category change
  recordCategoryChange(transactionId: string, oldCategoryId?: string, newCategoryId?: string): void {
    if (!newCategoryId || oldCategoryId === newCategoryId) return;
    
    const categoryChanges = getStoredCategoryChanges();
    const change: TransactionCategoryChange = {
      transactionId,
      oldCategoryId,
      newCategoryId,
      timestamp: new Date().toISOString()
    };
    
    categoryChanges.push(change);
    storeCategoryChanges(categoryChanges);
  }

  // Get category changes
  getCategoryChanges(): TransactionCategoryChange[] {
    return getStoredCategoryChanges();
  }

  // Suggest a category for a transaction based on rules
  suggestCategory(transaction: Omit<Transaction, 'id' | 'category'>): string {
    const rules = this.getCategoryRules();
    const suggestedCategory = this.findMatchingCategoryByRules(transaction, rules);
    
    if (suggestedCategory) {
      return suggestedCategory;
    }
    
    // If no rules match, try to match with existing transactions
    const transactions = this.getAllTransactions();
    const title = transaction.title.toLowerCase();
    
    // Find similar transactions
    const similarTransactions = transactions.filter(t => 
      t.title.toLowerCase().includes(title) || title.includes(t.title.toLowerCase())
    );
    
    if (similarTransactions.length > 0) {
      // Group by category and count
      const categoryCounts: Record<string, number> = {};
      similarTransactions.forEach(t => {
        if (t.category) {
          if (!categoryCounts[t.category]) {
            categoryCounts[t.category] = 0;
          }
          categoryCounts[t.category]++;
        }
      });
      
      // Find most common category
      let maxCount = 0;
      let mostCommonCategory = 'Uncategorized';
      
      Object.entries(categoryCounts).forEach(([category, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonCategory = category;
        }
      });
      
      return mostCommonCategory;
    }
    
    // If no matches, use default based on transaction amount
    return transaction.amount < 0 ? 'Expenses' : 'Income';
  }

  // Find matching category based on rules
  private findMatchingCategoryByRules(transaction: Partial<Transaction>, rules: CategoryRule[]): string | undefined {
    const transactionText = [
      transaction.title,
      transaction.notes
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Try each rule in priority order
    for (const rule of rules) {
      let isMatch = false;
      
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          isMatch = regex.test(transactionText);
        } catch (err) {
          if (import.meta.env.MODE === 'development') {
            console.error('Invalid regex pattern in category rule:', rule.pattern);
          }
        }
      } else {
        isMatch = transactionText.includes(rule.pattern.toLowerCase());
      }
      
      if (isMatch) {
        return rule.categoryId;
      }
    }
    
    return undefined;
  }

  // Get full category path (including parent names)
  getCategoryPath(categoryId: string): string[] {
    const categories = this.getCategories();
    const result: string[] = [];
    
    let currentCategory = categories.find(c => c.id === categoryId);
    
    while (currentCategory) {
      result.unshift(currentCategory.name);
      
      if (currentCategory.parentId) {
        currentCategory = categories.find(c => c.id === currentCategory!.parentId);
      } else {
        currentCategory = undefined;
      }
    }
    
    return result;
  }

  // Get transactions for a specific category including subcategories
  getTransactionsForCategoryAndSubcategories(categoryId: string): Transaction[] {
    const transactions = this.getAllTransactions();
    const categories = this.getCategories();
    
    // Get all subcategory IDs
    const subcategoryIds = this.getAllSubcategoryIds(categoryId, categories);
    const categoryIds = [categoryId, ...subcategoryIds];
    
    return transactions.filter(t => categoryIds.includes(t.category));
  }

  // Get all subcategory IDs for a category
  private getAllSubcategoryIds(categoryId: string, categories: Category[]): string[] {
    const result: string[] = [];
    
    // Find direct children
    const directChildren = categories.filter(c => c.parentId === categoryId);
    
    // Add child IDs
    directChildren.forEach(child => {
      result.push(child.id);
      
      // Add grandchildren recursively
      const grandchildren = this.getAllSubcategoryIds(child.id, categories);
      result.push(...grandchildren);
    });
    
    return result;
  }

  // Get budget vs actual spending for a category
  getCategoryBudgetAnalysis(categoryId: string): {
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
  } {
    const categories = this.getCategories();
    const category = categories.find(c => c.id === categoryId);
    const budgeted = category?.metadata?.budget || 0;
    
    // Get all transactions for this category and its subcategories
    const transactions = this.getTransactionsForCategoryAndSubcategories(categoryId);
    
    // Calculate total spending (only expenses, which are negative amounts)
    const spent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const remaining = Math.max(0, budgeted - spent);
    const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 100;
    
    return {
      budgeted,
      spent,
      remaining,
      percentUsed
    };
  }
}

// Re-export Transaction interface for backward compatibility
export type { Transaction } from '@/types/transaction';

// Export a singleton instance
export const transactionService = new TransactionService();
