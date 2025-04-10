
// LearningEngineService.ts
import { v4 as uuidv4 } from 'uuid';
import { LearnedEntry, LearningEngineConfig, MatchResult } from '@/types/learning';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

const LEARNING_STORAGE_KEY = 'xpensia_learned_entries';
const LEARNING_CONFIG_KEY = 'xpensia_learning_config';

const DEFAULT_CONFIG: LearningEngineConfig = {
  enabled: true,
  maxEntries: 200,
  minConfidenceThreshold: 0.3,
  saveAutomatically: true
};

class LearningEngineService {
  private config: LearningEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

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

  public saveConfig(config: Partial<LearningEngineConfig>): void {
    try {
      this.config = { ...this.config, ...config };
      localStorage.setItem(LEARNING_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving learning engine config:', error);
    }
  }

  public getConfig(): LearningEngineConfig {
    return { ...this.config };
  }

  public learnFromTransaction(rawMessage: string, transaction: Transaction, senderHint: string = ''): void {
    if (!this.config.enabled || !rawMessage || !transaction) return;

    try {
      const entries = this.getLearnedEntries();
      const existingEntryIndex = entries.findIndex(entry => this.calculateSimilarity(entry.rawMessage, rawMessage) > 0.9);

      const amount = parseFloat(transaction.amount.toString());
      if (isNaN(amount) || Math.abs(amount) > 1000000) return;

      const newEntry: LearnedEntry = {
        id: existingEntryIndex >= 0 ? entries[existingEntryIndex].id : uuidv4(),
        rawMessage,
        senderHint,
        confirmedFields: {
          type: transaction.type,
          amount,
          category: transaction.category || 'Uncategorized',
          subcategory: transaction.subcategory,
          account: transaction.fromAccount || '',
          currency: (transaction.currency as SupportedCurrency) || 'USD',
          person: transaction.person,
          vendor: this.extractVendor(rawMessage)
        },
        timestamp: new Date().toISOString(),
        tokens: this.tokenizeMessage(rawMessage)
      };

      if (existingEntryIndex >= 0) {
        entries[existingEntryIndex] = newEntry;
      } else {
        if (entries.length >= this.config.maxEntries) entries.pop();
        entries.unshift(newEntry);
      }

      this.saveLearnedEntries(entries);
    } catch (error) {
      console.error('Error learning from transaction:', error);
    }
  }

  public findBestMatch(message: string, senderHint: string = ''): MatchResult {
    if (!this.config.enabled || !message) return { entry: null, confidence: 0, matched: false };

    try {
      const entries = this.getLearnedEntries();
      if (entries.length === 0) return { entry: null, confidence: 0, matched: false };

      const messageTokens = this.tokenizeMessage(message);
      let bestMatch: LearnedEntry | null = null;
      let highestConfidence = 0;

      for (const entry of entries) {
        let confidence = this.calculateTokenSimilarity(messageTokens, entry.tokens);
        if (senderHint && entry.senderHint && senderHint.toLowerCase().includes(entry.senderHint.toLowerCase())) {
          confidence += 0.1;
          if (confidence > 1) confidence = 1;
        }

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = entry;
        }
      }

      if (bestMatch && highestConfidence >= this.config.minConfidenceThreshold) {
        bestMatch.confidence = highestConfidence;
        return { entry: bestMatch, confidence: highestConfidence, matched: true };
      }

      return { entry: null, confidence: highestConfidence, matched: false };
    } catch (error) {
      console.error('Error finding best match:', error);
      return { entry: null, confidence: 0, matched: false };
    }
  }

  public getLearnedEntries(): LearnedEntry[] {
    try {
      const storedEntries = localStorage.getItem(LEARNING_STORAGE_KEY);
      if (storedEntries) return JSON.parse(storedEntries);
    } catch (error) {
      console.error('Error retrieving learned entries:', error);
    }
    return [];
  }

  private saveLearnedEntries(entries: LearnedEntry[]): void {
    try {
      localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving learned entries:', error);
    }
  }

  public clearLearnedEntries(): void {
    try {
      localStorage.removeItem(LEARNING_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing learned entries:', error);
    }
  }

  private tokenizeMessage(message: string): string[] {
    if (!message) return [];
    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  private calculateTokenSimilarity(tokensA: string[], tokensB: string[]): number {
    if (!tokensA.length || !tokensB.length) return 0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    let weightedScore = 0;
    intersection.forEach(token => {
      let weight = 1;
      if (token.match(/^\d+(\.\d+)?$/)) weight = 1.5;
      if (token === 'sar' || token === 'egp' || token === 'usd') weight = 2.0;
      weightedScore += weight;
    });

    let maxScore = [...union].reduce((acc, token) => {
      let weight = 1;
      if (token.match(/^\d+(\.\d+)?$/)) weight = 1.5;
      if (token === 'sar' || token === 'egp' || token === 'usd') weight = 2.0;
      return acc + weight;
    }, 0);

    return maxScore > 0 ? weightedScore / maxScore : 0;
  }

  private calculateSimilarity(strA: string, strB: string): number {
    if (!strA || !strB) return 0;
    const a = strA.toLowerCase();
    const b = strB.toLowerCase();
    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) matrix[i] = [i];
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[a.length][b.length];
    const maxLength = Math.max(a.length, b.length);
    return maxLength > 0 ? 1 - distance / maxLength : 1;
  }

  private extractVendor(message: string): string {
    const match = message.match(/لدى[:\s]*(.+?)\s+في[:\s]/i);
    return match ? match[1].trim() : '';
  }
}

export const learningEngineService = new LearningEngineService();
