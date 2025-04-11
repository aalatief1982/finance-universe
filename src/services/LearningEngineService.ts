
// Enhanced LearningEngineService.ts - Field-Based Learning
import { v4 as uuidv4 } from 'uuid';
import { LearnedEntry, LearningEngineConfig, MatchResult } from '@/types/learning';
import { Transaction } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

const LEARNING_STORAGE_KEY = 'xpensia_learned_entries';
const LEARNING_CONFIG_KEY = 'xpensia_learning_config';

const DEFAULT_CONFIG: LearningEngineConfig = {
  enabled: true,
  maxEntries: 200,
  minConfidenceThreshold: 0.75,
  saveAutomatically: true
};

class LearningEngineService {
  private config: LearningEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): LearningEngineConfig {
    try {
      const stored = localStorage.getItem(LEARNING_CONFIG_KEY);
      if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch (err) { console.error('Config load error:', err); }
    return DEFAULT_CONFIG;
  }

  public saveConfig(config: Partial<LearningEngineConfig>) {
    this.config = { ...this.config, ...config };
    localStorage.setItem(LEARNING_CONFIG_KEY, JSON.stringify(this.config));
  }

  public getConfig(): LearningEngineConfig {
    return { ...this.config };
  }

  public learnFromTransaction(raw: string, txn: Transaction, senderHint = '', customFieldTokenMap?: Record<string, string[]>): void {
    if (!this.config.enabled || !raw || !txn) return;
    const entries = this.getLearnedEntries();
    const tokens = this.tokenize(raw);
    const id = uuidv4();

    const fieldTokenMap = customFieldTokenMap || {
      amount: this.extractAmountTokens(raw),
      currency: this.extractCurrencyTokens(raw),
      vendor: this.extractVendorTokens(raw),
      account: this.extractAccountTokens(raw)
    };

    const newEntry: LearnedEntry = {
      id,
      rawMessage: raw,
      senderHint,
      confirmedFields: {
        type: txn.type,
        amount: parseFloat(txn.amount.toString()),
        category: txn.category || 'Uncategorized',
        subcategory: txn.subcategory,
        account: txn.fromAccount || '',
        currency: txn.currency as SupportedCurrency,
        person: txn.person,
        vendor: txn.title || '' // Using title instead of vendor
      },
      tokens,
      fieldTokenMap,
      timestamp: new Date().toISOString()
    };

    if (entries.length >= this.config.maxEntries) entries.pop();
    entries.unshift(newEntry);
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(entries));
  }

  public findBestMatch(message: string, senderHint = ''): MatchResult {
    if (!this.config.enabled || !message) return { entry: null, confidence: 0, matched: false };
    const entries = this.getLearnedEntries();
    const tokens = this.tokenize(message);

    let bestMatch: LearnedEntry | null = null;
    let bestScore = 0;

    for (const entry of entries) {
      let score = this.compareFields(entry.fieldTokenMap, tokens);
      if (senderHint && entry.senderHint?.toLowerCase().includes(senderHint.toLowerCase())) {
        score += 0.1;
        if (score > 1) score = 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= this.config.minConfidenceThreshold) {
      bestMatch.confidence = bestScore;
      return { entry: bestMatch, confidence: bestScore, matched: true };
    }
    return { entry: null, confidence: bestScore, matched: false };
  }

  // Making methods public so they can be used by LearningTester
  public compareFields(fieldMap: any, tokens: string[]): number {
    let score = 0;
    const totalFields = Object.keys(fieldMap).length;
    Object.values(fieldMap).forEach((fieldTokens: string[]) => {
      const match = fieldTokens.some(token => tokens.includes(token));
      if (match) score += 1;
    });
    return totalFields ? score / totalFields : 0;
  }

  public tokenize(msg: string): string[] {
    return msg
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  public extractAmountTokens(msg: string): string[] {
    const match = msg.match(/\b(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)\b/g);
    return match ? match.map(m => m.replace(/,/g, '')) : [];
  }

  public extractCurrencyTokens(msg: string): string[] {
    return ['sar', 'egp', 'usd', 'aed', 'bhd'].filter(cur => msg.toLowerCase().includes(cur));
  }

  public extractVendorTokens(msg: string): string[] {
    const match = msg.match(/(?:لدى|from|at|vendor|to)[:\s]*([^\n]+)/i);
    return match ? match[1].toLowerCase().split(/\s+/).filter(Boolean) : [];
  }

  public extractAccountTokens(msg: string): string[] {
    const match = msg.match(/\*{2,}\d+/);
    return match ? [match[0].replace(/\*/g, '')] : [];
  }

  public getLearnedEntries(): LearnedEntry[] {
    try {
      const stored = localStorage.getItem(LEARNING_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading entries:', e);
      return [];
    }
  }

  public clearLearnedEntries(): void {
    localStorage.removeItem(LEARNING_STORAGE_KEY);
  }
}

export const learningEngineService = new LearningEngineService();
