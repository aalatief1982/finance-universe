// Import the Template type correctly
import { Template, StructureTemplateEntry } from '@/types/template';
import { LearnedEntry, MatchResult, PositionedToken, LearningEngineConfig } from '@/types/learning';
import { TemplateStructureService } from './TemplateStructureService';
import { Transaction } from '@/types/transaction';

export const learningEngineService = {
  /**
   * Find the best match for a given text.
   *
   * @param text - The text to match against existing templates.
   * @returns A MatchResult object indicating whether a match was found and the confidence level.
   */
  findBestMatch(text: string, senderHint?: string): MatchResult {
    // Detect Arabic bank transaction format
    const isArabicBankTransaction = 
      (text.includes('شراء') || text.includes('مبلغ') || text.includes('بطاقة')) && 
      (text.includes('SAR') || text.includes('ريال'));

    // Detect "لدى:" pattern which indicates vendor in Arabic bank messages
    const hasVendorPattern = text.includes('لدى:') || text.includes('لدى');
    
    // If it looks like an Arabic bank transaction with a vendor
    if (isArabicBankTransaction && hasVendorPattern) {
      // Extract amount
      const amountMatch = text.match(/مبلغ: ([A-Z]{3}) ([\d.,]+)/);
      const amount = amountMatch ? parseFloat(amountMatch[2].replace(',', '.')) : 0;
      
      // Extract currency
      const currency = amountMatch ? amountMatch[1] : 'SAR';
      
      // Extract vendor - matches after "لدى:" or "لدى "
      const vendorMatch = text.match(/لدى:?\s*([^,\n]+)/);
      const vendor = vendorMatch ? vendorMatch[1].trim() : '';
      
      // Extract date if available
      const dateMatch = text.match(/في: (\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

      // Create a mock learned entry to simulate a template match
      const mockEntry: LearnedEntry = {
        id: 'template-arabic-bank',
        rawMessage: 'شراء عبر نقاط البيع\nبطاقة: ***xxxx;mada;\nمبلغ: SAR xxx.xx\nلدى: {vendor}\nفي: {date}',
        senderHint: 'bank-sms',
        templateHash: 'arabic-bank-template',
        confirmedFields: {
          type: 'expense',
          amount: amount,
          category: 'Shopping',
          account: 'Card',
          currency: currency as any,
          vendor: vendor
        },
        tokens: [],
        fieldTokenMap: {
          amount: [],
          currency: [],
          vendor: [],
          account: [],
          date: []
        },
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        userConfirmed: true
      };

      return {
        entry: mockEntry,
        confidence: 0.85, // High confidence for this pattern
        matched: true
      };
    }

    // Mock implementation: Default to non-match for other message types
    return {
      entry: null,
      confidence: 0,
      matched: false,
    };
  },

  matchUsingTemplateStructure(rawText: string): any {
    // Detect Arabic bank transaction format
    const isArabicBankTransaction = 
      (rawText.includes('شراء') || rawText.includes('مبلغ') || rawText.includes('بطاقة')) && 
      (rawText.includes('SAR') || rawText.includes('ريال'));

    if (isArabicBankTransaction) {
      // Extract amount
      const amountMatch = rawText.match(/مبلغ: ([A-Z]{3}) ([\d.,]+)/);
      const amount = amountMatch ? parseFloat(amountMatch[2].replace(',', '.')) : 0;
      
      // Extract currency
      const currency = amountMatch ? amountMatch[1] : 'SAR';
      
      // Extract vendor - matches after "لدى:" or "لدى "
      const vendorMatch = rawText.match(/لدى:?\s*([^,\n]+)/);
      const vendor = vendorMatch ? vendorMatch[1].trim() : '';
      
      // Extract date if available
      const dateMatch = rawText.match(/في: (\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      
      // Extract card number if available
      const cardMatch = rawText.match(/بطاقة: \*+(\d+)/);
      const cardNumber = cardMatch ? `***${cardMatch[1]}` : '';

      return {
        templateHash: 'arabic-bank-structure',
        confidence: 0.85,
        inferredTransaction: {
          amount: amount,
          currency: currency,
          description: vendor,
          fromAccount: cardNumber || 'Card',
          type: 'expense',
          date: date
        }
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
    return { amount: 0, description: '', type: 'expense' };
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
    return [];
  },

  /**
   * Extract currency tokens with position information
   */
  extractCurrencyTokensWithPosition(msg: string): PositionedToken[] {
    return [];
  },

  /**
   * Extract vendor tokens with position information
   */
  extractVendorTokensWithPosition(msg: string): PositionedToken[] {
    return [];
  },

  /**
   * Extract account tokens with position information
   */
  extractAccountTokensWithPosition(msg: string): PositionedToken[] {
    return [];
  }
};
