/**
 * @file CategorySuggestionService.ts
 * @description Rule- and similarity-based category suggestions for transactions.
 *
 * @module services/CategorySuggestionService
 *
 * @responsibilities
 * 1. Suggest categories using rule matches (regex or substring)
 * 2. Fallback to similar-transaction matching by title
 * 3. Create category rules from user-confirmed transactions
 *
 * @dependencies
 * - TransactionService.ts: category rules and transaction history
 *
 * @review-tags
 * - @risk: invalid regex patterns must not crash suggestion flow
 * - @data-quality: similarity matching should avoid false positives
 *
 * @review-checklist
 * - [ ] Rules evaluated in priority order
 * - [ ] Regex errors handled without throwing in production
 * - [ ] Similarity matching excludes empty titles
 */

import { Transaction, CategoryRule } from '@/types/transaction';
import { transactionService } from '@/services/TransactionService';

class CategorySuggestionService {
  // Suggest a category based on transaction details
  suggestCategory(transaction: Omit<Transaction, 'id' | 'category'>): string {
    // First try to match based on category rules
    const suggestedByRules = this.suggestCategoryByRules(transaction);
    if (suggestedByRules) {
      return suggestedByRules;
    }
    
    // If no rule matches, try to suggest based on similar transactions
    const suggestedBySimilarity = this.suggestCategoryBySimilarTransactions(transaction);
    if (suggestedBySimilarity) {
      return suggestedBySimilarity;
    }
    
    // Default fallback based on transaction amount
    return transaction.amount < 0 ? 'Expenses' : 'Income';
  }
  
  // Suggest category based on predefined rules
  private suggestCategoryByRules(transaction: Omit<Transaction, 'id' | 'category'>): string | null {
    const rules = transactionService.getCategoryRules();
    
    // Skip if no rules available
    if (!rules || rules.length === 0) {
      return null;
    }
    
    // Create a searchable text from transaction details
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
    
    return null;
  }
  
  // Suggest a category based on similar existing transactions
  private suggestCategoryBySimilarTransactions(transaction: Omit<Transaction, 'id' | 'category'>): string | null {
    const transactions = transactionService.getAllTransactions();
    if (!transactions || transactions.length === 0) {
      return null;
    }
    
    const title = transaction.title.toLowerCase();
    
    // Find similar transactions by title
    const similarTransactions = transactions.filter(t => 
      t.title.toLowerCase().includes(title) || title.includes(t.title.toLowerCase())
    );
    
    if (similarTransactions.length === 0) {
      return null;
    }
    
    // Group by category and count occurrences
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
    let mostCommonCategory = null;
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCategory = category;
      }
    });
    
    return mostCommonCategory;
  }
  
  // Create a new category rule based on a transaction
  createRuleFromTransaction(
    transaction: Transaction, 
    categoryId: string, 
    pattern?: string, 
    isRegex: boolean = false
  ): CategoryRule {
    // If no pattern is provided, use the transaction title
    const rulePattern = pattern || transaction.title;
    
    // Create a new rule with high priority
    const newRule: Omit<CategoryRule, 'id'> = {
      pattern: rulePattern,
      categoryId,
      isRegex,
      priority: 100, // High priority
      description: `Rule created from transaction: ${transaction.title}`
    };
    
    // Save the rule
    return transactionService.addCategoryRule(newRule);
  }
  
  // Find transactions that would match a given pattern
  findTransactionsByPattern(pattern: string, isRegex: boolean = false): Transaction[] {
    const transactions = transactionService.getAllTransactions();
    
    return transactions.filter(transaction => {
      const transactionText = [
        transaction.title,
        transaction.notes
      ].filter(Boolean).join(' ');
      
      if (isRegex) {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(transactionText);
        } catch (err) {
          if (import.meta.env.MODE === 'development') {
            console.error('Invalid regex pattern:', pattern);
          }
          return false;
        }
      } else {
        return transactionText.toLowerCase().includes(pattern.toLowerCase());
      }
    });
  }
  
  // Generate rule suggestions based on uncategorized transactions
  generateRuleSuggestions(): Array<{
    pattern: string;
    matchCount: number;
    suggestedCategoryId: string;
    confidence: number;
  }> {
    const transactions = transactionService.getAllTransactions();
    const uncategorizedTransactions = transactions.filter(t => !t.category || t.category === 'Uncategorized');
    
    if (uncategorizedTransactions.length === 0) {
      return [];
    }
    
    // Group transactions by title patterns
    const titlePatterns = new Map<string, Transaction[]>();
    
    uncategorizedTransactions.forEach(transaction => {
      // Extract potential patterns (words) from the title
      const title = transaction.title;
      const words = title.split(/\s+/).filter(word => word.length > 3);
      
      words.forEach(word => {
        if (!titlePatterns.has(word)) {
          titlePatterns.set(word, []);
        }
        titlePatterns.get(word)!.push(transaction);
      });
      
      // Also add the full title as a pattern
      if (!titlePatterns.has(title)) {
        titlePatterns.set(title, []);
      }
      titlePatterns.get(title)!.push(transaction);
    });
    
    // Generate suggestions
    const suggestions: Array<{
      pattern: string;
      matchCount: number;
      suggestedCategoryId: string;
      confidence: number;
    }> = [];
    
    titlePatterns.forEach((matchingTransactions, pattern) => {
      // Only suggest patterns that match multiple transactions
      if (matchingTransactions.length < 2) {
        return;
      }
      
      // Try to find a category for this pattern
      const categorizedTransactions = this.findTransactionsByPattern(pattern)
        .filter(t => t.category && t.category !== 'Uncategorized');
      
      if (categorizedTransactions.length === 0) {
        return;
      }
      
      // Count occurrences of each category
      const categoryCounts: Record<string, number> = {};
      categorizedTransactions.forEach(t => {
        if (!categoryCounts[t.category]) {
          categoryCounts[t.category] = 0;
        }
        categoryCounts[t.category]++;
      });
      
      // Find the most common category
      let maxCount = 0;
      let suggestedCategoryId = '';
      
      Object.entries(categoryCounts).forEach(([category, count]) => {
        if (count > maxCount) {
          maxCount = count;
          suggestedCategoryId = category;
        }
      });
      
      // Calculate confidence level (0-100)
      const confidence = Math.min(
        100,
        Math.round((maxCount / categorizedTransactions.length) * 100)
      );
      
      // Only suggest if confidence is above threshold
      if (confidence >= 60) {
        suggestions.push({
          pattern,
          matchCount: matchingTransactions.length,
          suggestedCategoryId,
          confidence
        });
      }
    });
    
    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Apply rule suggestions to uncategorized transactions
  applyRuleSuggestions(minConfidence: number = 80): number {
    const suggestions = this.generateRuleSuggestions()
      .filter(suggestion => suggestion.confidence >= minConfidence);
    
    let appliedCount = 0;
    
    // Create rules from high-confidence suggestions
    suggestions.forEach(suggestion => {
      // Create the rule
      const newRule: Omit<CategoryRule, 'id'> = {
        pattern: suggestion.pattern,
        categoryId: suggestion.suggestedCategoryId,
        isRegex: false,
        priority: 50, // Medium priority
        description: `Auto-generated rule for pattern: ${suggestion.pattern}`
      };
      
      transactionService.addCategoryRule(newRule);
      appliedCount++;
    });
    
    // Apply rules to all transactions
    if (appliedCount > 0) {
      transactionService.applyAllCategoryRules();
    }
    
    return appliedCount;
  }
}

// Export singleton instance
export const categorySuggestionService = new CategorySuggestionService();
