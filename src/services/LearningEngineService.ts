
// Enhanced LearningEngineService.ts - Field-Based Learning with Position Awareness
import { v4 as uuidv4 } from 'uuid';
import { LearnedEntry, LearningEngineConfig, MatchResult, PositionedToken } from '@/types/learning';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { masterMindService } from '@/services/MasterMindService';

const LEARNING_STORAGE_KEY = 'xpensia_learned_entries';
const LEARNING_CONFIG_KEY = 'xpensia_learning_config';

const DEFAULT_CONFIG: LearningEngineConfig = {
  enabled: true,
  maxEntries: 200,
  minConfidenceThreshold: 0.75,
  saveAutomatically: false // Changed to false - require explicit confirmation
};

// Define the structure of fieldTokenMap
export interface FieldTokenMap {
  amount: PositionedToken[];
  currency: PositionedToken[];
  vendor: PositionedToken[];
  account: PositionedToken[];
  date: PositionedToken[];
}

class LearningEngineService {
  private config: LearningEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public inferFieldsFromText(message: string): Partial<Transaction> {
    const tokens = this.tokenize(message);
    const amountToken = this.extractAmountTokensWithPosition(message)[0];
    const currencyToken = this.extractCurrencyTokensWithPosition(message)[0];
    const vendorToken = this.extractVendorTokensWithPosition(message)[0];
    const accountToken = this.extractAccountTokensWithPosition(message)[0];
    const dateToken = this.extractDateTokensWithPosition(message)[0];
    const type = this.inferTypeFromText(message);

    return {
      amount: amountToken ? parseFloat(amountToken.token) : 0,
      currency: currencyToken ? currencyToken.token.toUpperCase() as SupportedCurrency : 'SAR',
      description: vendorToken ? vendorToken.token : '',
      fromAccount: accountToken ? accountToken.token : '',
      type,
      date: dateToken ? dateToken.token : new Date().toISOString(),
      category: vendorToken ? this.lookupCategoryForVendor(vendorToken.token) : 'Uncategorized',
      subcategory: ''
    };
  }

  private inferTypeFromText(message: string): TransactionType {
    const t = message.toLowerCase();
    if (t.includes('شراء') || t.includes('debited') || t.includes('سداد')) return 'expense';
    if (t.includes('حوالة واردة') || t.includes('credited')) return 'income';
    return 'expense';
  }

  private extractDateTokensWithPosition(message: string): PositionedToken[] {
    const matches = Array.from(message.matchAll(/\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4}/g));
    return matches.map(match => {
      const position = match.index || 0;
      const contextSize = 2;
      
      // Get context around the token
      const messageTokens = message.split(/\s+/);
      const tokenPosition = messageTokens.findIndex(t => t.includes(match[0]));
      
      const context = {
        before: tokenPosition > 0 
          ? messageTokens.slice(Math.max(0, tokenPosition - contextSize), tokenPosition) 
          : [],
        after: tokenPosition >= 0 && tokenPosition < messageTokens.length - 1 
          ? messageTokens.slice(tokenPosition + 1, Math.min(messageTokens.length, tokenPosition + contextSize + 1)) 
          : []
      };
      
      return { 
        token: match[0], 
        position,
        context
      };
    });
  }

  private lookupCategoryForVendor(vendor: string): string {
    const lower = vendor.toLowerCase();
    if (lower.includes('othaim') || lower.includes('tamimi')) return 'Groceries';
    if (lower.includes('careem') || lower.includes('uber')) return 'Transport';
    if (lower.includes('aldrees') || lower.includes('gas')) return 'Fuel';
    return 'Uncategorized';
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

  public learnFromTransaction(
    raw: string, 
    txn: Transaction, 
    senderHint = '',
    customFieldTokenMap?: Partial<FieldTokenMap>
  ): void {
    if (!this.config.enabled || !raw || !txn) return;
    const entries = this.getLearnedEntries();
    const tokens = this.tokenize(raw);
    const id = uuidv4();

    const fieldTokenMap: FieldTokenMap = {
      amount: this.extractAmountTokensWithPosition(raw),
      currency: this.extractCurrencyTokensWithPosition(raw),
      vendor: this.extractVendorTokensWithPosition(raw),
      account: this.extractAccountTokensWithPosition(raw),
      date: this.extractDateTokensWithPosition(raw)
    };

    // Register tokens to MasterMind with position information
    Object.entries(fieldTokenMap).forEach(([field, positionedTokens]) => {
      positionedTokens.forEach(pt => {
        masterMindService.registerTokenWithPosition(pt.token, field, pt.position, pt.context);
      });
    });

    // Override with custom token map if provided
    if (customFieldTokenMap) {
      if (customFieldTokenMap.amount) fieldTokenMap.amount = customFieldTokenMap.amount;
      if (customFieldTokenMap.currency) fieldTokenMap.currency = customFieldTokenMap.currency;
      if (customFieldTokenMap.vendor) fieldTokenMap.vendor = customFieldTokenMap.vendor;
      if (customFieldTokenMap.account) fieldTokenMap.account = customFieldTokenMap.account;
      if (customFieldTokenMap.date) fieldTokenMap.date = customFieldTokenMap.date;
    }

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
        vendor: txn.description || '' // Changed from txn.vendor to txn.description
      },
      tokens,
      fieldTokenMap,
      timestamp: new Date().toISOString(),
      userConfirmed: true // Mark as user confirmed
    };

    if (entries.length >= this.config.maxEntries) entries.pop();
    entries.unshift(newEntry);
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(entries));
  }

  public findBestMatch(message: string, senderHint = ''): MatchResult {
    if (!this.config.enabled || !message) return { entry: null, confidence: 0, matched: false };
    const entries = this.getLearnedEntries();
    const tokens = this.tokenize(message);

    // Filter to only use entries that were confirmed by users
    const confirmedEntries = entries.filter(entry => entry.userConfirmed);
    
    let bestMatch: LearnedEntry | null = null;
    let bestScore = 0;

    for (const entry of confirmedEntries) {
      let score = this.compareFieldsWithPosition(entry.fieldTokenMap, message);
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

  private compareFieldsWithPosition(fieldMap: FieldTokenMap, message: string): number {
    let score = 0;
    const totalFields = Object.keys(fieldMap).length;
    let fieldsMatched = 0;
    
    // Extract tokens with positions from the message
    const messageAmountTokens = this.extractAmountTokensWithPosition(message);
    const messageCurrencyTokens = this.extractCurrencyTokensWithPosition(message);
    const messageVendorTokens = this.extractVendorTokensWithPosition(message);
    const messageAccountTokens = this.extractAccountTokensWithPosition(message);
    const messageDateTokens = this.extractDateTokensWithPosition(message);
    
    const messageFieldMap = {
      amount: messageAmountTokens,
      currency: messageCurrencyTokens,
      vendor: messageVendorTokens,
      account: messageAccountTokens,
      date: messageDateTokens
    };
    
    // Score each field type
    Object.entries(fieldMap).forEach(([field, learnedTokens]) => {
      if (learnedTokens.length === 0) return;
      
      const currentFieldTokens = messageFieldMap[field as keyof typeof messageFieldMap];
      
      if (currentFieldTokens.length > 0) {
        fieldsMatched++;
        
        // Additional scoring for position similarity
        const positionScore = this.calculatePositionScore(learnedTokens, currentFieldTokens);
        score += (1 + positionScore) / 2; // Weight regular match and position match equally
      }
    });
    
    // Calculate final score based on fields matched and position accuracy
    return totalFields > 0 ? score / totalFields : 0;
  }
  
  private calculatePositionScore(learnedTokens: PositionedToken[], messageTokens: PositionedToken[]): number {
    // Simple case: if no tokens to compare
    if (learnedTokens.length === 0 || messageTokens.length === 0) return 0;
    
    // Compare context similarity
    let contextSimilaritySum = 0;
    let comparisons = 0;
    
    for (const learned of learnedTokens) {
      for (const message of messageTokens) {
        // Skip tokens that don't match at all
        if (learned.token !== message.token) continue;
        
        // Calculate context similarity if context exists
        if (learned.context && message.context) {
          let beforeSimilarity = 0;
          let afterSimilarity = 0;
          
          // Compare before context
          if (learned.context.before && learned.context.before.length > 0 &&
              message.context.before && message.context.before.length > 0) {
            const commonBefore = learned.context.before.filter(token => 
              message.context?.before?.includes(token));
            beforeSimilarity = commonBefore.length / Math.max(learned.context.before.length, message.context.before.length);
          }
          
          // Compare after context
          if (learned.context.after && learned.context.after.length > 0 &&
              message.context.after && message.context.after.length > 0) {
            const commonAfter = learned.context.after.filter(token => 
              message.context?.after?.includes(token));
            afterSimilarity = commonAfter.length / Math.max(learned.context.after.length, message.context.after.length);
          }
          
          const contextSimilarity = (beforeSimilarity + afterSimilarity) / 2;
          contextSimilaritySum += contextSimilarity;
          comparisons++;
        }
      }
    }
    
    return comparisons > 0 ? contextSimilaritySum / comparisons : 0;
  }

  public tokenize(msg: string): string[] {
    return msg
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  public extractAmountTokensWithPosition(msg: string): PositionedToken[] {
    const matches = Array.from(msg.matchAll(/\b(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)\b/g));
    return matches.map(match => {
      const position = match.index || 0;
      const tokenValue = match[0].replace(/,/g, '');
      
      // Get context around the token
      const contextSize = 2;
      const messageTokens = msg.split(/\s+/);
      const tokenPosition = messageTokens.findIndex(t => t.includes(match[0]));
      
      const context = {
        before: tokenPosition > 0 
          ? messageTokens.slice(Math.max(0, tokenPosition - contextSize), tokenPosition) 
          : [],
        after: tokenPosition >= 0 && tokenPosition < messageTokens.length - 1 
          ? messageTokens.slice(tokenPosition + 1, Math.min(messageTokens.length, tokenPosition + contextSize + 1)) 
          : []
      };
      
      return { 
        token: tokenValue, 
        position,
        context
      };
    });
  }

  public extractCurrencyTokensWithPosition(msg: string): PositionedToken[] {
    const currencies = ['sar', 'egp', 'usd', 'aed', 'bhd'];
    const result: PositionedToken[] = [];
    
    currencies.forEach(currency => {
      const regex = new RegExp(`\\b${currency}\\b`, 'gi');
      const matches = Array.from(msg.matchAll(regex));
      
      matches.forEach(match => {
        const position = match.index || 0;
        
        // Get context around the token
        const contextSize = 2;
        const messageTokens = msg.split(/\s+/);
        const tokenPosition = messageTokens.findIndex(t => t.toLowerCase() === currency);
        
        const context = {
          before: tokenPosition > 0 
            ? messageTokens.slice(Math.max(0, tokenPosition - contextSize), tokenPosition) 
            : [],
          after: tokenPosition >= 0 && tokenPosition < messageTokens.length - 1 
            ? messageTokens.slice(tokenPosition + 1, Math.min(messageTokens.length, tokenPosition + contextSize + 1)) 
            : []
        };
        
        result.push({ 
          token: currency, 
          position,
          context
        });
      });
    });
    
    return result;
  }

  public extractVendorTokensWithPosition(msg: string): PositionedToken[] {
    const patterns = [
      { regex: /(?:لدى|from|at|vendor|to)[:\s]*([^\n]+)/i, group: 1 },
      { regex: /(?:paid to|purchase at|bought from)[:\s]*([^\n]+)/i, group: 1 }
    ];
    
    const result: PositionedToken[] = [];
    
    for (const pattern of patterns) {
      const matches = Array.from(msg.matchAll(pattern.regex));
      
      matches.forEach(match => {
        if (match[pattern.group]) {
          const vendorText = match[pattern.group].trim();
          const position = (match.index || 0) + match[0].indexOf(vendorText);
          
          // Get context around the token
          const contextSize = 2;
          const messageTokens = msg.split(/\s+/);
          const tokenPosition = messageTokens.findIndex(t => t.includes(vendorText));
          
          const context = {
            before: tokenPosition > 0 
              ? messageTokens.slice(Math.max(0, tokenPosition - contextSize), tokenPosition) 
              : [],
            after: tokenPosition >= 0 && tokenPosition < messageTokens.length - 1 
              ? messageTokens.slice(tokenPosition + 1, Math.min(messageTokens.length, tokenPosition + contextSize + 1)) 
              : []
          };
          
          // Split the vendor text into tokens and add each one
          vendorText.toLowerCase().split(/\s+/).filter(Boolean).forEach((token, i) => {
            result.push({ 
              token, 
              position: position + i,
              context
            });
          });
        }
      });
    }
    
    return result;
  }

  public extractAccountTokensWithPosition(msg: string): PositionedToken[] {
    const matches = Array.from(msg.matchAll(/\*{2,}\d+/g));
    return matches.map(match => {
      const position = match.index || 0;
      const token = match[0].replace(/\*/g, '');
      
      // Get context around the token
      const contextSize = 2;
      const messageTokens = msg.split(/\s+/);
      const tokenPosition = messageTokens.findIndex(t => t.includes(match[0]));
      
      const context = {
        before: tokenPosition > 0 
          ? messageTokens.slice(Math.max(0, tokenPosition - contextSize), tokenPosition) 
          : [],
        after: tokenPosition >= 0 && tokenPosition < messageTokens.length - 1 
          ? messageTokens.slice(tokenPosition + 1, Math.min(messageTokens.length, tokenPosition + contextSize + 1)) 
          : []
      };
      
      return { 
        token, 
        position,
        context
      };
    });
  }
  
  // Compatibility methods for backward compatibility
  public extractAmountTokens(msg: string): string[] {
    return this.extractAmountTokensWithPosition(msg).map(pt => pt.token);
  }
  
  public extractCurrencyTokens(msg: string): string[] {
    return this.extractCurrencyTokensWithPosition(msg).map(pt => pt.token);
  }
  
  public extractVendorTokens(msg: string): string[] {
    return this.extractVendorTokensWithPosition(msg).map(pt => pt.token);
  }
  
  public extractAccountTokens(msg: string): string[] {
    return this.extractAccountTokensWithPosition(msg).map(pt => pt.token);
  }

  public getLearnedEntries(): LearnedEntry[] {
    try {
      const stored = localStorage.getItem(LEARNING_STORAGE_KEY);
      if (!stored) return [];
      
      const entries = JSON.parse(stored);
      
      // Migrate old entries if needed
      const migratedEntries = entries.map((entry: any) => {
        if (!entry.userConfirmed) {
          return {
            ...entry,
            userConfirmed: true // Assume all existing entries were user-confirmed
          };
        }
        return entry;
      });
      
      return migratedEntries;
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
