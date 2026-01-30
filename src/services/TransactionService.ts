/**
 * @file TransactionService.ts
 * @description Central service managing all transaction operations including
 *              CRUD, dual-entry transfers, category management, and rule-based
 *              auto-categorization.
 * 
 * @module services/TransactionService
 * 
 * @responsibilities
 * 1. Transaction CRUD operations with validation
 * 2. Dual-entry transfer creation (debit/credit pairs linked by transferId)
 * 3. Category and subcategory management
 * 4. Category rule creation, prioritization, and application
 * 5. Automatic category suggestion based on rules and history
 * 6. SMS transaction processing (delegated to SmsProcessingService)
 * 7. Analytics delegation to TransactionAnalyticsService
 * 
 * @storage-keys
 * - xpensia_transactions: Main transaction store
 * - xpensia_categories: Category definitions
 * - xpensia_category_rules: Auto-categorization rules
 * - xpensia_category_changes: Category change history
 * 
 * @dependencies
 * - storage-utils.ts: Persistence layer
 * - TransactionAnalyticsService.ts: Summary/grouping calculations
 * - SmsProcessingService.ts: SMS message parsing
 * - firebase-analytics.ts: Event logging
 * 
 * @review-checklist
 * - [ ] Transfer sign handling (debit negative, credit positive)
 * - [ ] Category deletion cascade to transactions
 * - [ ] Rule priority ordering maintenance
 * - [ ] Similar transaction matching for suggestions
 * 
 * @created 2024
 * @modified 2025-01-30
 */

import { v4 as uuidv4 } from 'uuid';
import { Transaction, Category, CategoryRule, TransactionCategoryChange } from '@/types/transaction';
import { getStoredTransactions, storeTransactions, getStoredCategories, storeCategories, getStoredCategoryRules, storeCategoryRules, getStoredCategoryChanges, storeCategoryChanges } from '@/utils/storage-utils';
import { transactionAnalyticsService } from './TransactionAnalyticsService';
import { processSmsEntries } from './SmsProcessingService';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

class TransactionService {

  // ============================================================================
  // SECTION: Basic Transaction CRUD Operations
  // PURPOSE: Core read/write operations for single transactions
  // REVIEW: Ensure proper ID generation and storage consistency
  // ============================================================================

  /**
   * Get all transactions from storage
   * @returns Array of all stored transactions
   */
  getAllTransactions(): Transaction[] {
    return getStoredTransactions();
  }

  /**
   * Save transactions array to storage (overwrites existing)
   * @param transactions - Complete transactions array to persist
   */
  saveTransactions(transactions: Transaction[]): void {
    storeTransactions(transactions);
  }

  // ============================================================================
  // SECTION: Transaction Creation with Transfer Handling
  // PURPOSE: Handle dual-entry accounting for transfers (debit + credit entries)
  // REVIEW: Verify transfer amount signs and linked transferId consistency
  // ============================================================================

  /**
   * Add a new transaction with automatic categorization.
   * For transfers, creates TWO linked entries with shared transferId.
   * 
   * @param transaction - Transaction data without ID
   * @returns Single transaction for income/expense, or array of two for transfers
   * 
   * @review-focus
   * - Transfer amount signs: debit should be negative (line 96), credit positive (line 107)
   * - transferId links both halves for atomic operations
   * - Category forced to "Transfer" for transfer entries
   */
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction | Transaction[] {
    // For non-transfers, create a single record as before
    if (transaction.type !== 'transfer') {
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
    
    // For transfers, create TWO linked records
    const transferId = uuidv4();
    const amount = Math.abs(transaction.amount);
    
    // Debit entry (money leaving source account)
    // @review-risk Amount must be NEGATIVE for debit entries
    const debitEntry: Transaction = {
      ...transaction,
      id: uuidv4(),
      transferId,
      transferDirection: 'out',
      amount: -amount,
      category: 'Transfer', // Force category to "Transfer"
      type: 'transfer',
    };
    
    // Credit entry (money entering destination account)
    // @review-risk Amount must be POSITIVE for credit entries
    const creditEntry: Transaction = {
      ...transaction,
      id: uuidv4(),
      transferId,
      transferDirection: 'in',
      amount: amount,
      category: 'Transfer',
      type: 'transfer',
    };
    
    const transactions = this.getAllTransactions();
    transactions.push(debitEntry, creditEntry);
    this.saveTransactions(transactions);
    
    // Log analytics event
    logAnalyticsEvent('transaction_add', {
      category: 'Transfer',
      amount: amount,
      currency: transaction.currency,
      type: 'transfer'
    });
    
    return [debitEntry, creditEntry];
  }

  // ============================================================================
  // SECTION: Transaction Update Operations
  // PURPOSE: Handle updates including linked transfer pairs atomically
  // REVIEW: Verify both halves of transfers update together
  // ============================================================================

  /**
   * Update an existing transaction.
   * For transfers, delegates to updateTransfer to update both linked records.
   * 
   * @param id - Transaction ID to update
   * @param updates - Partial transaction fields to update
   * @returns Updated transaction or null if not found
   * 
   * @review-focus Records category change history for non-transfer updates
   */
  updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id'>>): Transaction | null {
    const transactions = this.getAllTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const oldTransaction = transactions[index];
    
    // For transfers, update both linked records
    if (oldTransaction.transferId) {
      return this.updateTransfer(oldTransaction.transferId, updates);
    }
    
    const updatedTransaction = { ...oldTransaction, ...updates };
    transactions[index] = updatedTransaction;
    this.saveTransactions(transactions);
    
    // Record category change if category was updated
    if (updates.category && updates.category !== oldTransaction.category) {
      this.recordCategoryChange(id, oldTransaction.category, updates.category);
    }
    
    return updatedTransaction;
  }

  /**
   * Update both halves of a transfer atomically.
   * Maintains correct amount signs for each direction.
   * 
   * @param transferId - Shared transfer ID linking both entries
   * @param updates - Fields to update on both entries
   * @returns The debit entry as representative, or null if not found
   * 
   * @review-focus
   * - Amount sign maintenance: out = negative, in = positive (lines 176-178)
   * - Shared fields (title, date, notes) update on both entries
   */
  updateTransfer(transferId: string, updates: Partial<Omit<Transaction, 'id'>>): Transaction | null {
    const transactions = this.getAllTransactions();
    const linkedTransactions = transactions.filter(t => t.transferId === transferId);
    
    // @review-risk Should have exactly 2 linked entries
    if (linkedTransactions.length !== 2) return null;
    
    const updatedIds: string[] = [];
    
    linkedTransactions.forEach(t => {
      const index = transactions.findIndex(tx => tx.id === t.id);
      if (index === -1) return;
      
      // Update shared fields
      const updated: Transaction = {
        ...t,
        title: updates.title ?? t.title,
        date: updates.date ?? t.date,
        fromAccount: updates.fromAccount ?? t.fromAccount,
        toAccount: updates.toAccount ?? t.toAccount,
        notes: updates.notes ?? t.notes,
        currency: updates.currency ?? t.currency,
        // Amount update requires special handling to maintain correct signs
        // @review-risk Ensure sign is preserved based on direction
        amount: updates.amount !== undefined 
          ? (t.transferDirection === 'out' ? -Math.abs(updates.amount) : Math.abs(updates.amount))
          : t.amount,
      };
      
      transactions[index] = updated;
      updatedIds.push(t.id);
    });
    
    this.saveTransactions(transactions);
    
    // Return the debit entry as representative
    return transactions.find(t => updatedIds.includes(t.id) && t.transferDirection === 'out') || null;
  }

  // ============================================================================
  // SECTION: Transaction Delete Operations
  // PURPOSE: Handle deletion including linked transfer pairs atomically
  // REVIEW: Verify both halves of transfers delete together
  // ============================================================================

  /**
   * Delete a transaction by ID.
   * For transfers, deletes both linked entries.
   * 
   * @param id - Transaction ID to delete
   * @returns true if deleted, false if not found
   */
  deleteTransaction(id: string): boolean {
    const transactions = this.getAllTransactions();
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) return false;
    
    // For transfers, delete both linked records
    if (transaction.transferId) {
      return this.deleteTransfer(transaction.transferId);
    }
    
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

  /**
   * Delete both halves of a transfer atomically.
   * 
   * @param transferId - Shared transfer ID to delete
   * @returns true if deleted, false if not found
   */
  deleteTransfer(transferId: string): boolean {
    const transactions = this.getAllTransactions();
    const filteredTransactions = transactions.filter(t => t.transferId !== transferId);
    
    if (filteredTransactions.length === transactions.length) {
      return false;
    }
    
    this.saveTransactions(filteredTransactions);
    
    // Log analytics event
    logAnalyticsEvent('transaction_delete', {
      transfer_id: transferId,
      type: 'transfer'
    });
    
    return true;
  }

  // ============================================================================
  // SECTION: SMS Processing Delegation
  // PURPOSE: Convert SMS messages to transaction objects
  // REVIEW: Verify SmsProcessingService handles all message formats
  // ============================================================================

  /**
   * Process SMS messages to extract transactions.
   * Delegates parsing to SmsProcessingService.
   * 
   * @param messages - Array of SMS message objects
   * @returns Array of parsed Transaction objects
   */
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    const entries = messages.map(msg => ({
      sender: msg.sender,
      message: msg.message,
      timestamp: msg.date.toISOString()
    }));
    return processSmsEntries(entries);
  }

  // ============================================================================
  // SECTION: Analytics Delegation
  // PURPOSE: Delegate summary/grouping calculations to analytics service
  // REVIEW: Ensure analytics service properly excludes transfers
  // ============================================================================

  /**
   * Get transactions summary statistics (income, expenses, balance).
   * Delegates to TransactionAnalyticsService.
   * 
   * @review-focus Analytics service MUST exclude transfers from totals
   */
  getTransactionsSummary() {
    return transactionAnalyticsService.getTransactionsSummary();
  }

  /**
   * Get transactions grouped by category (expenses only).
   */
  getTransactionsByCategory() {
    return transactionAnalyticsService.getTransactionsByCategory();
  }

  /**
   * Get transactions grouped by time period for charts.
   * @param period - 'week', 'month', or 'year'
   */
  getTransactionsByTimePeriod(period: 'week' | 'month' | 'year' = 'month') {
    return transactionAnalyticsService.getTransactionsByTimePeriod(period);
  }

  // ============================================================================
  // SECTION: Category CRUD Operations
  // PURPOSE: Manage category definitions and hierarchy
  // REVIEW: Verify subcategory deletion cascade and transaction re-assignment
  // ============================================================================

  /**
   * Get all categories from storage.
   */
  getCategories(): Category[] {
    return getStoredCategories();
  }

  /**
   * Save categories array to storage.
   */
  saveCategories(categories: Category[]): void {
    storeCategories(categories);
  }

  /**
   * Add a new category with generated ID.
   * Marks as user-created.
   * 
   * @param category - Category data without ID
   * @returns Created category with ID
   */
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

  /**
   * Update an existing category.
   * 
   * @param id - Category ID to update
   * @param updates - Partial category fields
   * @returns Updated category or null if not found
   */
  updateCategory(id: string, updates: Partial<Omit<Category, 'id'>>): Category | null {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    const updatedCategory = { ...categories[index], ...updates };
    categories[index] = updatedCategory;
    this.saveCategories(categories);
    
    return updatedCategory;
  }

  /**
   * Delete a category and re-assign affected transactions.
   * 
   * @param id - Category ID to delete
   * @returns true if deleted, false if has subcategories or not found
   * 
   * @review-focus
   * - Prevents deletion if category has subcategories (line 332)
   * - Re-assigns transactions to parent or 'Uncategorized' (lines 346-359)
   */
  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    
    // Check if this category has subcategories
    // @review-risk Cannot delete categories with children
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
    // @review-focus Transactions move to parent category or 'Uncategorized'
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

  // ============================================================================
  // SECTION: Category Rules CRUD
  // PURPOSE: Manage auto-categorization rules with priority ordering
  // REVIEW: Verify priority-based insertion and rule matching order
  // ============================================================================

  /**
   * Get all category rules, ordered by priority.
   */
  getCategoryRules(): CategoryRule[] {
    return getStoredCategoryRules();
  }

  /**
   * Save category rules to storage.
   */
  saveCategoryRules(rules: CategoryRule[]): void {
    storeCategoryRules(rules);
  }

  /**
   * Add a new category rule with priority-based insertion.
   * Higher priority rules are inserted earlier in the array.
   * 
   * @param rule - Rule data without ID
   * @returns Created rule with ID
   * 
   * @review-focus Priority insertion logic (lines 385-397)
   */
  addCategoryRule(rule: Omit<CategoryRule, 'id'>): CategoryRule {
    const newRule = {
      ...rule,
      id: uuidv4()
    };
    
    const rules = this.getCategoryRules();
    
    // Insert based on priority (higher priority = earlier in array)
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

  /**
   * Update an existing rule with re-ordering based on priority.
   * 
   * @param id - Rule ID to update
   * @param updates - Partial rule fields
   * @returns Updated rule or null if not found
   * 
   * @review-focus Rule is removed and re-inserted based on new priority
   */
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

  /**
   * Delete a category rule.
   * 
   * @param id - Rule ID to delete
   * @returns true if deleted, false if not found
   */
  deleteCategoryRule(id: string): boolean {
    const rules = this.getCategoryRules();
    const filteredRules = rules.filter(r => r.id !== id);
    
    if (filteredRules.length === rules.length) {
      return false;
    }
    
    this.saveCategoryRules(filteredRules);
    return true;
  }

  // ============================================================================
  // SECTION: Auto-Categorization Logic
  // PURPOSE: Apply rules to transactions and track category changes
  // REVIEW: Verify rule application order and change history recording
  // ============================================================================

  /**
   * Apply all category rules to all transactions.
   * Returns count of transactions that were re-categorized.
   * 
   * @returns Number of transactions whose category changed
   * 
   * @review-focus Records change history for each re-categorization
   */
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

  /**
   * Record a category change for audit/learning purposes.
   * 
   * @param transactionId - Transaction that was re-categorized
   * @param oldCategoryId - Previous category
   * @param newCategoryId - New category
   */
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

  /**
   * Get all recorded category changes.
   */
  getCategoryChanges(): TransactionCategoryChange[] {
    return getStoredCategoryChanges();
  }

  // ============================================================================
  // SECTION: Category Suggestion Engine
  // PURPOSE: Suggest categories for new transactions based on rules and history
  // REVIEW: Verify fallback logic and similar transaction matching
  // ============================================================================

  /**
   * Suggest a category for a transaction.
   * Priority: Rules > Similar transactions > Default by amount sign
   * 
   * @param transaction - Transaction without ID or category
   * @returns Suggested category name
   * 
   * @review-focus
   * - First tries rule matching (line 490)
   * - Falls back to similar transaction history (lines 497-527)
   * - Final fallback based on amount sign (line 531)
   */
  suggestCategory(transaction: Omit<Transaction, 'id' | 'category'>): string {
    const rules = this.getCategoryRules();
    const suggestedCategory = this.findMatchingCategoryByRules(transaction, rules);
    
    if (suggestedCategory) {
      return suggestedCategory;
    }
    
    // If no rules match, try to match with existing transactions
    const transactions = this.getAllTransactions();
    const title = transaction.title.toLowerCase();
    
    // Find similar transactions by title substring match
    // @review-risk Simple substring matching may produce false positives
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

  // ============================================================================
  // SECTION: Rule Matching Engine
  // PURPOSE: Match transactions against rules using regex or substring
  // REVIEW: Verify regex safety and pattern matching order
  // ============================================================================

  /**
   * Find matching category by applying rules in priority order.
   * 
   * @param transaction - Transaction to match
   * @param rules - Rules to apply (assumed sorted by priority)
   * @returns Matching category ID or undefined
   * 
   * @review-focus
   * - Regex matching with error handling (lines 549-556)
   * - Substring matching fallback (line 558)
   * - First match wins (priority order)
   */
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
          // @review-risk Invalid regex patterns should be validated on creation
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

  // ============================================================================
  // SECTION: Category Hierarchy Utilities
  // PURPOSE: Navigate category tree for path display and subcategory queries
  // REVIEW: Verify recursive traversal doesn't cause infinite loops
  // ============================================================================

  /**
   * Get full category path from root to leaf.
   * 
   * @param categoryId - Category to get path for
   * @returns Array of category names from root to leaf
   */
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

  /**
   * Get transactions for a category including all its subcategories.
   * 
   * @param categoryId - Root category ID
   * @returns All transactions in this category tree
   */
  getTransactionsForCategoryAndSubcategories(categoryId: string): Transaction[] {
    const transactions = this.getAllTransactions();
    const categories = this.getCategories();
    
    // Get all subcategory IDs
    const subcategoryIds = this.getAllSubcategoryIds(categoryId, categories);
    const categoryIds = [categoryId, ...subcategoryIds];
    
    return transactions.filter(t => categoryIds.includes(t.category));
  }

  /**
   * Recursively get all subcategory IDs for a category.
   * 
   * @param categoryId - Parent category ID
   * @param categories - All categories array
   * @returns Array of all descendant category IDs
   * 
   * @review-risk Assumes no circular references in category hierarchy
   */
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

  // ============================================================================
  // SECTION: Budget Analysis
  // PURPOSE: Calculate budget vs actual for category-based budgeting
  // REVIEW: Verify expense filtering and subcategory inclusion
  // ============================================================================

  /**
   * Get budget vs actual spending analysis for a category.
   * Includes spending from all subcategories.
   * 
   * @param categoryId - Category to analyze
   * @returns Budget analysis object with budgeted, spent, remaining, percentUsed
   * 
   * @review-focus
   * - Only counts negative amounts (expenses) (lines 631-633)
   * - Includes subcategory spending (line 629)
   */
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
