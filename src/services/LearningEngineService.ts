
import { v4 as uuidv4 } from 'uuid';
import { LearnedEntry, LearningEngineConfig, MatchResult } from '@/types/learning';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

// Storage key for learned entries
const LEARNING_STORAGE_KEY = 'xpensia_learned_entries';
const LEARNING_CONFIG_KEY = 'xpensia_learning_config';

// Default configuration
const DEFAULT_CONFIG: LearningEngineConfig = {
  enabled: true,
  maxEntries: 200,
  minConfidenceThreshold: 0.8, // 80%
  saveAutomatically: true
};

/**
 * Service for managing the local learning engine
 * that improves message parsing over time.
 */
class LearningEngineService {
  private config: LearningEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load the learning engine configuration
   */
  private loadConfig(): LearningEngineConfig {
    try {
      const storedConfig = localStorage.getItem(LEARNING_CONFIG_KEY);
      if (storedConfig) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Error loading learning engine config:', error);
    }
    
    return DEFAULT_CONFIG;
  }

  /**
   * Save the learning engine configuration
   */
  public saveConfig(config: Partial<LearningEngineConfig>): void {
    try {
      this.config = { ...this.config, ...config };
      localStorage.setItem(LEARNING_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving learning engine config:', error);
    }
  }

  /**
   * Get the current learning engine configuration
   */
  public getConfig(): LearningEngineConfig {
    return { ...this.config };
  }

  /**
   * Learn from a confirmed transaction
   * 
   * @param rawMessage The original message that was parsed
   * @param transaction The final transaction after user confirmation/edits
   * @param senderHint Optional hint about the sender (e.g., bank name)
   */
  public learnFromTransaction(
    rawMessage: string, 
    transaction: Transaction, 
    senderHint: string = ''
  ): void {
    if (!this.config.enabled || !rawMessage || !transaction) {
      return;
    }

    try {
      // Get existing entries
      const entries = this.getLearnedEntries();
      
      // Check if we already have a very similar entry
      const existingEntryIndex = entries.findIndex(
        entry => this.calculateSimilarity(entry.rawMessage, rawMessage) > 0.9
      );

      // Create new learned entry
      const newEntry: LearnedEntry = {
        id: existingEntryIndex >= 0 ? entries[existingEntryIndex].id : uuidv4(),
        rawMessage,
        senderHint,
        confirmedFields: {
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          category: transaction.category || 'Uncategorized',
          subcategory: transaction.subcategory,
          account: transaction.fromAccount || '',
          currency: (transaction.currency as SupportedCurrency) || 'USD',
          person: transaction.person
        },
        timestamp: new Date().toISOString(),
        tokens: this.tokenizeMessage(rawMessage)
      };

      // Either update existing or add new
      if (existingEntryIndex >= 0) {
        entries[existingEntryIndex] = newEntry;
      } else {
        // Enforce the max entries limit
        if (entries.length >= this.config.maxEntries) {
          // Remove oldest entry
          entries.pop();
        }
        entries.unshift(newEntry);
      }

      // Save back to storage
      this.saveLearnedEntries(entries);
    } catch (error) {
      console.error('Error learning from transaction:', error);
    }
  }

  /**
   * Find the best match for a given message
   * 
   * @param message The message to match against learned entries
   * @param senderHint Optional hint about the sender for better matching
   * @returns The match result with confidence score
   */
  public findBestMatch(message: string, senderHint: string = ''): MatchResult {
    if (!this.config.enabled || !message) {
      return { entry: null, confidence: 0, matched: false };
    }

    try {
      const entries = this.getLearnedEntries();
      
      if (entries.length === 0) {
        return { entry: null, confidence: 0, matched: false };
      }

      // Tokenize the input message
      const messageTokens = this.tokenizeMessage(message);
      
      // Find the best match
      let bestMatch: LearnedEntry | null = null;
      let highestConfidence = 0;

      for (const entry of entries) {
        // Calculate similarity score
        const similarity = this.calculateTokenSimilarity(messageTokens, entry.tokens);
        
        // Add bonus for matching sender
        let confidence = similarity;
        if (senderHint && entry.senderHint && 
            senderHint.toLowerCase().includes(entry.senderHint.toLowerCase())) {
          confidence += 0.1; // 10% bonus for matching sender
          if (confidence > 1) confidence = 1; // Cap at 1.0
        }

        // Update best match if this is better
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = entry;
        }
      }

      // Only return if confidence exceeds threshold
      if (bestMatch && highestConfidence >= this.config.minConfidenceThreshold) {
        // Update the confidence in the matched entry
        bestMatch.confidence = highestConfidence;
        return { 
          entry: bestMatch, 
          confidence: highestConfidence,
          matched: true 
        };
      }

      return { entry: null, confidence: highestConfidence, matched: false };
    } catch (error) {
      console.error('Error finding best match:', error);
      return { entry: null, confidence: 0, matched: false };
    }
  }

  /**
   * Get all learned entries
   */
  public getLearnedEntries(): LearnedEntry[] {
    try {
      const storedEntries = localStorage.getItem(LEARNING_STORAGE_KEY);
      if (storedEntries) {
        return JSON.parse(storedEntries);
      }
    } catch (error) {
      console.error('Error retrieving learned entries:', error);
    }
    
    return [];
  }

  /**
   * Save learned entries
   */
  private saveLearnedEntries(entries: LearnedEntry[]): void {
    try {
      localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving learned entries:', error);
    }
  }

  /**
   * Clear all learned entries
   */
  public clearLearnedEntries(): void {
    try {
      localStorage.removeItem(LEARNING_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing learned entries:', error);
    }
  }

  /**
   * Tokenize a message for better matching
   */
  private tokenizeMessage(message: string): string[] {
    if (!message) return [];

    // Remove special characters, convert to lowercase, and split by whitespace
    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Calculate simple token-based similarity between two sets of tokens
   * Using Jaccard similarity for token sets
   */
  private calculateTokenSimilarity(tokensA: string[], tokensB: string[]): number {
    if (!tokensA.length || !tokensB.length) return 0;

    // Create sets for easier intersection/union
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    
    // Calculate intersection size
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    
    // Calculate union size
    const union = new Set([...setA, ...setB]);
    
    // Jaccard similarity: size of intersection / size of union
    return intersection.size / union.size;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * Useful for comparing raw messages
   */
  private calculateSimilarity(strA: string, strB: string): number {
    if (!strA || !strB) return 0;
    
    const a = strA.toLowerCase();
    const b = strB.toLowerCase();
    
    // Simple implementation of Levenshtein distance
    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    // The distance is the bottom-right cell of the matrix
    const distance = matrix[a.length][b.length];
    
    // Convert to a similarity score between 0 and 1
    // 1 means identical, 0 means completely different
    const maxLength = Math.max(a.length, b.length);
    return maxLength > 0 ? 1 - distance / maxLength : 1;
  }
}

export const learningEngineService = new LearningEngineService();
