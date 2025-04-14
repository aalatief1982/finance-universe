
// Import the Template type correctly
import { Template, StructureTemplateEntry } from '@/types/template';
import { LearnedEntry, MatchResult, PositionedToken, LearningEngineConfig } from '@/types/learning';
import { TemplateStructureService } from './TemplateStructureService';
import { Transaction } from '@/types/transaction';

export const learningEngineService = {
  /**
   * Mock function to simulate finding the best match for a given text.
   *
   * @param text - The text to match against existing templates.
   * @returns A MatchResult object indicating whether a match was found and the confidence level.
   */
  findBestMatch(text: string, senderHint?: string): MatchResult {
    // Mock implementation: Always return a non-match with low confidence.
    return {
      entry: null,
      confidence: 0,
      matched: false,
    };
  },

  matchUsingTemplateStructure(rawText: string): any {
    // This is a mock implementation
    // In a real implementation, this would analyze the structure of the text
    // and try to match it against known templates
    
    // For common bank SMS patterns, we could look for:
    // - Currency symbols or codes followed by numbers (for amounts)
    // - Words like "debited", "credited", "purchase", "payment"
    // - Dates in various formats
    // - Account numbers or masked card numbers
    
    if (!rawText) return null;
    
    // Example implementation - detecting simple patterns
    const amountRegex = /(?:RS\.?|SAR|USD|AED|\$|€|£)?(\s*)(\d+(?:[.,]\d+)?)/i;
    const dateRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i;
    const vendorRegex = /(?:at|to|from|@)\s+([A-Za-z0-9\s&.,\-_]+?)(?:\s+on|\s+for|\s+\d|\s+with|$)/i;
    
    // Try to extract data
    const amountMatch = rawText.match(amountRegex);
    const dateMatch = rawText.match(dateRegex);
    const vendorMatch = rawText.match(vendorRegex);
    
    // If we have enough data, consider it a match
    if (amountMatch || dateMatch || vendorMatch) {
      const inferredTransaction: Partial<Transaction> = {};
      
      if (amountMatch) {
        inferredTransaction.amount = parseFloat(amountMatch[2].replace(/[,]/g, ''));
      }
      
      if (dateMatch) {
        try {
          const dateStr = dateMatch[1];
          // Attempt to parse the date (this is simplified)
          inferredTransaction.date = new Date(dateStr).toISOString();
        } catch (e) {
          console.log("Failed to parse date:", e);
        }
      }
      
      if (vendorMatch) {
        inferredTransaction.description = vendorMatch[1].trim();
        inferredTransaction.title = vendorMatch[1].trim();
      }
      
      // Determine transaction type based on keywords
      if (/debit|purchase|payment|paid|withdraw|sent/i.test(rawText)) {
        inferredTransaction.type = 'expense';
      } else if (/credit|received|deposit|added|refund/i.test(rawText)) {
        inferredTransaction.type = 'income';
      }
      
      return {
        templateHash: "simple-pattern-matching",
        confidence: 0.7,
        inferredTransaction
      };
    }
    
    return null;
  },

  getLearnedEntries(): LearnedEntry[] {
    return [];
  },

  /**
   * Get the learning engine configuration
   */
  getConfig(): LearningEngineConfig {
    return {
      enabled: true,
      maxEntries: 100,
      minConfidenceThreshold: 0.6,
      saveAutomatically: true
    };
  },

  /**
   * Learn from a transaction to improve future matches
   */
  learnFromTransaction(
    rawMessage: string, 
    transaction: Transaction, 
    senderHint?: string, 
    customFieldTokenMap?: Partial<any>
  ): void {
    // Mock implementation
    console.log('Learning from transaction', { rawMessage, transaction, senderHint });
  },

  /**
   * Save learning engine configuration
   */
  saveConfig(config: Partial<LearningEngineConfig>): void {
    // Mock implementation
    console.log('Saving config', config);
  },

  /**
   * Infer transaction fields from text
   */
  inferFieldsFromText(message: string): Partial<Transaction> | null {
    // Mock implementation
    if (!message) return null;
    
    // Example implementation for inferring fields
    const amountMatch = message.match(/(?:RS\.?|SAR|USD|AED|\$|€|£)?(\s*)(\d+(?:[.,]\d+)?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[2].replace(/[,]/g, '')) : 0;
    
    // Try to extract description/vendor
    const vendorMatch = message.match(/(?:at|to|from|@)\s+([A-Za-z0-9\s&.,\-_]+?)(?:\s+on|\s+for|\s+\d|\s+with|$)/i);
    const description = vendorMatch ? vendorMatch[1].trim() : '';
    
    // Determine transaction type based on keywords
    let type: 'expense' | 'income' | 'transfer' = 'expense';
    if (/credit|received|deposit|added|refund/i.test(message)) {
      type = 'income';
    } else if (/transfer|moved|sent to/i.test(message)) {
      type = 'transfer';
    }
    
    return { amount, description, type };
  },

  /**
   * Clear all learned entries
   */
  clearLearnedEntries(): void {
    // Mock implementation
    console.log('Clearing learned entries');
  },

  /**
   * Save user training data
   */
  saveUserTraining(
    message: string, 
    transaction: Partial<Transaction>, 
    senderHint?: string, 
    fieldTokenMap?: Record<string, string[]>
  ): void {
    // Mock implementation
    console.log('Saving user training', { message, transaction, senderHint, fieldTokenMap });
  },

  /**
   * Tokenize a message into individual tokens
   */
  tokenize(msg: string): string[] {
    return msg.split(/\s+/).filter(Boolean);
  },

  /**
   * Extract amount tokens with position information
   */
  extractAmountTokensWithPosition(msg: string): PositionedToken[] {
    // Simple implementation to detect amounts in text
    const amountRegex = /(?:RS\.?|SAR|USD|AED|\$|€|£)?(\s*)(\d+(?:[.,]\d+)?)/gi;
    const results: PositionedToken[] = [];
    
    let match;
    while ((match = amountRegex.exec(msg)) !== null) {
      results.push({
        token: match[0],
        position: match.index,
        context: {
          before: msg.substring(Math.max(0, match.index - 50), match.index).split(/\s+/).filter(Boolean),
          after: msg.substring(match.index + match[0].length, Math.min(msg.length, match.index + match[0].length + 50)).split(/\s+/).filter(Boolean)
        }
      });
    }
    
    return results;
  },

  /**
   * Extract currency tokens with position information
   */
  extractCurrencyTokensWithPosition(msg: string): PositionedToken[] {
    // Simple implementation to detect currency symbols and codes
    const currencyRegex = /(?:RS\.?|SAR|USD|AED|\$|€|£)/gi;
    const results: PositionedToken[] = [];
    
    let match;
    while ((match = currencyRegex.exec(msg)) !== null) {
      results.push({
        token: match[0],
        position: match.index,
        context: {
          before: msg.substring(Math.max(0, match.index - 50), match.index).split(/\s+/).filter(Boolean),
          after: msg.substring(match.index + match[0].length, Math.min(msg.length, match.index + match[0].length + 50)).split(/\s+/).filter(Boolean)
        }
      });
    }
    
    return results;
  },

  /**
   * Extract vendor tokens with position information
   */
  extractVendorTokensWithPosition(msg: string): PositionedToken[] {
    // Try to extract vendor names from text
    const vendorRegex = /(?:at|to|from|@)\s+([A-Za-z0-9\s&.,\-_]+?)(?:\s+on|\s+for|\s+\d|\s+with|$)/gi;
    const results: PositionedToken[] = [];
    
    let match;
    while ((match = vendorRegex.exec(msg)) !== null) {
      if (match[1]) {
        const vendorName = match[1].trim();
        results.push({
          token: vendorName,
          position: match.index + match[0].indexOf(vendorName),
          context: {
            before: msg.substring(Math.max(0, match.index - 50), match.index).split(/\s+/).filter(Boolean),
            after: msg.substring(match.index + match[0].length, Math.min(msg.length, match.index + match[0].length + 50)).split(/\s+/).filter(Boolean)
          }
        });
      }
    }
    
    return results;
  },

  /**
   * Extract account tokens with position information
   */
  extractAccountTokensWithPosition(msg: string): PositionedToken[] {
    // Try to extract account numbers and card references
    const accountRegex = /(?:acct|account|card|a\/c)[:\s]*([A-Z0-9*\s]{4,}|ending in \d{4})/gi;
    const results: PositionedToken[] = [];
    
    let match;
    while ((match = accountRegex.exec(msg)) !== null) {
      if (match[1]) {
        const accountRef = match[1].trim();
        results.push({
          token: accountRef,
          position: match.index + match[0].indexOf(accountRef),
          context: {
            before: msg.substring(Math.max(0, match.index - 50), match.index).split(/\s+/).filter(Boolean),
            after: msg.substring(match.index + match[0].length, Math.min(msg.length, match.index + match[0].length + 50)).split(/\s+/).filter(Boolean)
          }
        });
      }
    }
    
    return results;
  }
};
