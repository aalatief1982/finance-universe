// Enhanced LearningEngineService.ts - Field-Based Learning with Position Awareness
import { v4 as uuidv4 } from 'uuid';
import { LearnedEntry, LearningEngineConfig, MatchResult, PositionedToken } from '@/types/learning';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { masterMindService } from '@/services/MasterMindService';

const LEARNING_STORAGE_KEY = 'xpensia_learned_entries';
const LEARNING_CONFIG_KEY = 'xpensia_learning_config';
const SENDER_TEMPLATES_KEY = 'xpensia_sender_templates';
const SEQUENCE_PATTERNS_KEY = 'xpensia_sequence_patterns';
const TRAIN_MODEL_THRESHOLD = 0.5;
const DEFAULT_CONFIG: LearningEngineConfig = {
  enabled: true,
  maxEntries: 200,
  minConfidenceThreshold: 0.75,
  saveAutomatically: false, // Changed to false - require explicit confirmation
  validationRequired: true, // New field for validation
  userConfirmationWeight: 0.2 // Weight for user confirmation in confidence score
};

// Interface for sender-specific templates
interface SenderTemplate {
  sender: string;
  templates: string[];
  commonPatterns: {
    [key: string]: {
      beforeTokens: string[];
      afterTokens: string[];
    }
  };
  confirmationCount: number;
}

// Interface for sequence patterns
interface SequencePattern {
  id: string;
  sequenceType: string; // e.g., "amount-follows-currency", "date-precedes-reference"
  fieldPair: [string, string]; // e.g., ["amount", "currency"]
  occurrenceCount: number;
  confidence: number;
  confirmedByUser: boolean;
}

// Define the structure of fieldTokenMap
export interface FieldTokenMap {
  amount: PositionedToken[];
  currency: PositionedToken[];
  vendor: PositionedToken[];
  account: PositionedToken[];
  date: PositionedToken[];
  title?: PositionedToken[]; // Made optional to match existing code
  type?: PositionedToken[]; // Added for completeness
}

class LearningEngineService {
  private config: LearningEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public inferFieldsFromText(message: string): Partial<Transaction> | null {
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

  // Added method to compute structure signature for a field token map
  public computeStructureSignature(fieldTokenMap: FieldTokenMap): string {
    try {
      // Create signature based on field positions and relationships
      const signature = Object.entries(fieldTokenMap)
        .filter(([_, tokens]) => tokens && tokens.length > 0)
        .map(([field, tokens]) => {
          // For each field, calculate average position
          const avgPosition = tokens.reduce((sum, token) => sum + token.position, 0) / tokens.length;
          return `${field}:${avgPosition.toFixed(0)}`;
        })
        .sort() // Sort to ensure consistent signature regardless of original order
        .join('|');
      
      return signature || 'no-structure'; // Return default if no valid structure
    } catch (error) {
      console.error('Error generating structure signature:', error);
      return 'signature-error';
    }
  }

  private computeTemplateHash(message: string): string {
    let normalized = message
      .replace(/\*{2,}\d+/g, '{account}')                // masked account numbers
      .replace(/\b\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?\b/g, '{amount}') // numbers
      .replace(/\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}/g, '{date}') // date formats
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim()
      .toLowerCase();

    // Optional: Use a simple hash or checksum (keep readable for now)
    return normalized;
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

  // Get all sender templates
  private getSenderTemplates(): SenderTemplate[] {
    try {
      const stored = localStorage.getItem(SENDER_TEMPLATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error loading sender templates:', err);
      return [];
    }
  }

  // Save sender templates
  private saveSenderTemplates(templates: SenderTemplate[]) {
    localStorage.setItem(SENDER_TEMPLATES_KEY, JSON.stringify(templates));
  }

  // Get all sequence patterns
  private getSequencePatterns(): SequencePattern[] {
    try {
      const stored = localStorage.getItem(SEQUENCE_PATTERNS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error loading sequence patterns:', err);
      return [];
    }
  }

  // Save sequence patterns
  private saveSequencePatterns(patterns: SequencePattern[]) {
    localStorage.setItem(SEQUENCE_PATTERNS_KEY, JSON.stringify(patterns));
  }

  // Update sender template based on a new message
  private updateSenderTemplate(raw: string, senderHint: string, fieldTokenMap: FieldTokenMap) {
    if (!senderHint) return;

    const templates = this.getSenderTemplates();
    let template = templates.find(t => t.sender.toLowerCase() === senderHint.toLowerCase());

    if (!template) {
      template = {
        sender: senderHint,
        templates: [],
        commonPatterns: {},
        confirmationCount: 0
      };
      templates.push(template);
    }

    // Add this message as a template if it's not already there
    if (!template.templates.includes(raw)) {
      template.templates.push(raw);
    }

    // Update confirmation count
    template.confirmationCount++;

    // Update common patterns for each field
    Object.entries(fieldTokenMap).forEach(([field, tokens]) => {
      if (!tokens || tokens.length === 0) return;

      if (!template!.commonPatterns[field]) {
        template!.commonPatterns[field] = {
          beforeTokens: [],
          afterTokens: []
        };
      }

      // Collect common context tokens
      tokens.forEach(token => {
        if (token.context) {
          if (token.context.before) {
            token.context.before.forEach(beforeToken => {
              if (!template!.commonPatterns[field].beforeTokens.includes(beforeToken)) {
                template!.commonPatterns[field].beforeTokens.push(beforeToken);
              }
            });
          }
          if (token.context.after) {
            token.context.after.forEach(afterToken => {
              if (!template!.commonPatterns[field].afterTokens.includes(afterToken)) {
                template!.commonPatterns[field].afterTokens.push(afterToken);
              }
            });
          }
        }
      });
    });

    this.saveSenderTemplates(templates);
  }

  // Extract sequence patterns from fieldTokenMap
  private extractSequencePatterns(fieldTokenMap: FieldTokenMap): void {
    const patterns = this.getSequencePatterns();
    const fieldKeys = Object.keys(fieldTokenMap);

    // Check each field pair for sequential patterns
    for (let i = 0; i < fieldKeys.length; i++) {
      for (let j = 0; j < fieldKeys.length; j++) {
        if (i === j) continue;

        const field1 = fieldKeys[i];
        const field2 = fieldKeys[j];
        const tokens1 = fieldTokenMap[field1 as keyof FieldTokenMap];
        const tokens2 = fieldTokenMap[field2 as keyof FieldTokenMap];

        if (!tokens1 || !tokens2 || tokens1.length === 0 || tokens2.length === 0) continue;

        // Check if field1 tokens typically come before field2 tokens
        tokens1.forEach(token1 => {
          tokens2.forEach(token2 => {
            if (token1.position < token2.position) {
              // Field1 comes before Field2
              this.updateSequencePattern(patterns, `${field1}-precedes-${field2}`, [field1, field2], true);
            } else if (token1.position > token2.position) {
              // Field2 comes before Field1
              this.updateSequencePattern(patterns, `${field2}-precedes-${field1}`, [field2, field1], true);
            }
          });
        });
      }
    }

    this.saveSequencePatterns(patterns);
  }

  // Update or create a sequence pattern
  private updateSequencePattern(
    patterns: SequencePattern[],
    sequenceType: string,
    fieldPair: [string, string],
    confirmedByUser: boolean
  ) {
    let pattern = patterns.find(p => p.sequenceType === sequenceType);

    if (!pattern) {
      pattern = {
        id: uuidv4(),
        sequenceType,
        fieldPair,
        occurrenceCount: 0,
        confidence: 0,
        confirmedByUser: false
      };
      patterns.push(pattern);
    }

    pattern.occurrenceCount++;
    
    // Update confidence based on occurrence count
    pattern.confidence = Math.min(0.9, pattern.occurrenceCount / 10);
    
    // If this is a user-confirmed pattern, mark it as such
    if (confirmedByUser && !pattern.confirmedByUser) {
      pattern.confirmedByUser = true;
      // Boost confidence for user-confirmed patterns
      pattern.confidence = Math.min(0.95, pattern.confidence + 0.2);
    }
  }

  // Validate transaction data before learning
  private validateTransactionData(txn: Transaction): boolean {
    if (!this.config.validationRequired) return true;

    // Basic validation checks
    if (!txn.amount || txn.amount <= 0) return false;
    if (!txn.currency) return false;
    if (!txn.type) return false;
    if (!txn.fromAccount && txn.type === 'expense') return false;
    
    return true;
  }

  public learnFromTransaction(
    raw: string, 
    txn: Transaction, 
    senderHint = '',
    customFieldTokenMap?: Partial<FieldTokenMap>
  ): void {
    if (!this.config.enabled || !raw || !txn) return;

    // Validate transaction data if validation is required
    if (!this.validateTransactionData(txn)) {
      console.warn('Transaction validation failed, not learning from this transaction');
      return;
    }

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
      if (customFieldTokenMap.title) fieldTokenMap.title = customFieldTokenMap.title;
      if (customFieldTokenMap.type) fieldTokenMap.type = customFieldTokenMap.type;
    }

    // Extract and store sequence patterns
    this.extractSequencePatterns(fieldTokenMap);

    // Update sender template with the new message
    this.updateSenderTemplate(raw, senderHint, fieldTokenMap);
    const templateHash = this.computeTemplateHash(raw);

    const newEntry: LearnedEntry = {
      id,
      rawMessage: raw,
      senderHint,
      templateHash,
      confirmedFields: {
        type: txn.type,
        amount: parseFloat(txn.amount.toString()),
        category: txn.category || 'Uncategorized',
        subcategory: txn.subcategory,
        account: txn.fromAccount || '',
        currency: txn.currency as SupportedCurrency,
        person: txn.person,
        vendor: txn.description || '' 
      },
      tokens,
      fieldTokenMap,
      timestamp: new Date().toISOString(),
      userConfirmed: true, // Mark as user confirmed
      confirmationHistory: [{ // New field to track confirmation history
        timestamp: new Date().toISOString(),
        source: 'user-explicit', // 'auto', 'user-explicit', 'system'
      }]
    };

    if (entries.length >= this.config.maxEntries) entries.pop();
    entries.unshift(newEntry);
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(entries));
  }

  public saveUserTraining(raw: string, txn: Partial<Transaction>, senderHint: string, fieldTokenMap: Record<string, string[]>): void {
    const entries = this.getLearnedEntries();
  
    const tokens = this.tokenize(raw);
    const id = uuidv4();
  
    // Convert string[] fieldTokenMap to PositionedToken[] format
    const positionedTokenMap: FieldTokenMap = {
      amount: [],
      currency: [],
      vendor: [],
      account: [],
      date: []
    };
  
    // Extract positions for tokens if they exist in the message
    Object.entries(fieldTokenMap).forEach(([field, tokenValues]) => {
      tokenValues.forEach(tokenValue => {
        const regex = new RegExp(`\\b${tokenValue}\\b`, 'g');
        const matches = Array.from(raw.matchAll(regex));
        
        if (matches.length > 0) {
          const position = matches[0].index || 0;
          const context = this.getContextForPosition(raw, position, tokenValue.length);
          
          const positionedToken: PositionedToken = {
            token: tokenValue,
            position,
            context
          };
          
          if (field === 'amount') positionedTokenMap.amount.push(positionedToken);
          else if (field === 'currency') positionedTokenMap.currency.push(positionedToken);
          else if (field === 'vendor') positionedTokenMap.vendor.push(positionedToken);
          else if (field === 'account') positionedTokenMap.account.push(positionedToken);
          else if (field === 'date') positionedTokenMap.date.push(positionedToken);
          else if (field === 'title' && !positionedTokenMap.title) {
            positionedTokenMap.title = [positionedToken];
          }
        }
      });
    });
  
    // Register tokens to MasterMind
    Object.entries(positionedTokenMap).forEach(([field, positionedTokens]) => {
      positionedTokens.forEach(pt => {
        masterMindService.registerTokenWithPosition(pt.token, field, pt.position, pt.context);
      });
    });
  
    // Sequence Patterns
    this.extractSequencePatterns(positionedTokenMap);
  
    // Sender Template
    this.updateSenderTemplate(raw, senderHint, positionedTokenMap);
  
    const templateHash = this.computeTemplateHash(raw);
    const structureSignature = this.computeStructureSignature(positionedTokenMap);
  
    // Make sure the transaction has all required fields
    const fullTransaction: Transaction = {
      id: id, // Use the generated id
      amount: txn.amount || 0,
      currency: txn.currency || 'SAR' as SupportedCurrency,
      description: txn.description || '',
      fromAccount: txn.fromAccount || '',
      type: txn.type || 'expense',
      date: txn.date || new Date().toISOString(),
      category: txn.category || 'Uncategorized',
      subcategory: txn.subcategory || '',
      title: txn.title || '',
      source: 'manual'
    };
  
    const entry: LearnedEntry = {
      id,
      rawMessage: raw,
      tokens,
      senderHint,
      fieldTokenMap: positionedTokenMap,
      confirmedFields: {
        type: fullTransaction.type,
        amount: fullTransaction.amount,
        category: fullTransaction.category,
        subcategory: fullTransaction.subcategory,
        account: fullTransaction.fromAccount,
        currency: fullTransaction.currency,
        person: fullTransaction.person,
        vendor: fullTransaction.description || ''
      },
      timestamp: new Date().toISOString(),
      userConfirmed: true,
      templateHash,
      structureSignature,
      confirmationHistory: [{
        timestamp: new Date().toISOString(),
        source: 'user-explicit'
      }]
    };
  
    // Keep at max limit
    if (entries.length >= this.config.maxEntries) entries.pop();
    entries.unshift(entry);
    localStorage.setItem('xpensia_learned_entries', JSON.stringify(entries));
  }
  
  // Helper method to get context for a position in text
  private getContextForPosition(text: string, position: number, length: number): { before?: string[], after?: string[] } {
    const contextSize = 2;
    const tokens = text.split(/\s+/);
    
    // Find which token contains our position
    let tokenIndex = -1;
    let currentPos = 0;
    
    for (let i = 0; i < tokens.length; i++) {
      if (currentPos <= position && position < currentPos + tokens[i].length) {
        tokenIndex = i;
        break;
      }
      // Add token length + 1 for the space
      currentPos += tokens[i].length + 1;
    }
    
    if (tokenIndex === -1) return {};
    
    return {
      before: tokenIndex > 0 ? tokens.slice(Math.max(0, tokenIndex - contextSize), tokenIndex) : [],
      after: tokenIndex < tokens.length - 1 ? tokens.slice(tokenIndex + 1, Math.min(tokens.length, tokenIndex + contextSize + 1)) : []
    };
  }

  // New method to calculate similarity between template hashes
  private templateHashSimilarity(hash1: string, hash2: string): number {
    if (!hash1 || !hash2) return 0;
    
    // Split into segments and remove empty strings
    const segments1 = hash1.split(/[\s,;:]+/).filter(Boolean);
    const segments2 = hash2.split(/[\s,;:]+/).filter(Boolean);
    
    // Count matching segments
    const uniqueSegments1 = new Set(segments1);
    const uniqueSegments2 = new Set(segments2);
    
    let matchCount = 0;
    for (const segment of uniqueSegments1) {
      if (uniqueSegments2.has(segment)) {
        matchCount++;
      }
    }
    
    // Structural placeholders should have higher weight
    const structuralTokens = ['{account}', '{amount}', '{date}', 'مبلغ', 'بطاقة', 'لدى', 'في'];
    let structuralMatchBonus = 0;
    
    for (const token of structuralTokens) {
      if (hash1.includes(token) && hash2.includes(token)) {
        structuralMatchBonus += 0.05; // 5% bonus per structural token match
      }
    }
    
    // Calculate base similarity
    const totalUniqueSegments = uniqueSegments1.size + uniqueSegments2.size;
    const baseSimilarity = totalUniqueSegments > 0 ? 
      (2 * matchCount) / totalUniqueSegments : 0;
    
    // Add structural bonus but cap at 1.0
    return Math.min(1.0, baseSimilarity + structuralMatchBonus);
  }

  public findBestMatch(message: string, senderHint = ''): MatchResult {
    if (!this.config.enabled || !message) {
      return { entry: null, confidence: 0, matched: false };
    }

    const entries = this.getLearnedEntries();
    const confirmedEntries = entries.filter(entry => entry.userConfirmed);

    let bestMatch: LearnedEntry | null = null;
    let bestScore = 0;
    const messageTemplateHash = this.computeTemplateHash(message);

    for (const entry of confirmedEntries) {
      // Initialize score as a let variable to allow reassignment
      let score = 0;

      // STEP 1 – Template Structure Match (40%)
      const templateSimilarity = this.calculateTextSimilarity(entry.rawMessage, message);
      const structureScore = templateSimilarity >= 0.85 ? 0.4 : templateSimilarity * 0.4;
      score += structureScore;

      // STEP 2 - Template Hash Similarity (25%) - NEW LOGIC
      const hashSimilarity = this.templateHashSimilarity(
        messageTemplateHash,
        entry.templateHash || this.computeTemplateHash(entry.rawMessage)
      );
      
      // Boost score significantly if hash similarity is high
      if (hashSimilarity > 0.75) {
        score += 0.25; // Full 25% bonus for high structural similarity
      } else {
        score += hashSimilarity * 0.25;
      }

      // STEP 3 - Remaining Checks (35% total) - using existing code
      // Sender Match + Coupling (15%) 
      let senderScore = 0;
      const senderTemplates = this.getSenderTemplates();
      const matchedSender = senderTemplates.find(t =>
        t.sender.toLowerCase() === senderHint.toLowerCase()
      );

      if (matchedSender && matchedSender.confirmationCount > 0) {
        const senderTemplateMatch = matchedSender.templates.some(template => {
          return this.calculateTextSimilarity(template, message) >= 0.8;
        });
        if (senderTemplateMatch) {
          senderScore += 0.15; // Full bonus for matching sender + structure
        } else if (entry.senderHint?.toLowerCase().includes(senderHint.toLowerCase())) {
          senderScore += 0.075; // Partial credit for sender name overlap
        }
      }
      score += senderScore;

      // Field Token Map Match (10%)
      const fieldMatchScore = this.compareFieldsWithPosition(entry.fieldTokenMap, message);
      score += fieldMatchScore * 0.1;

      // Contextual Cues and Patterns (10%)
      const contextBonus = this.scoreContextHints(message, entry.fieldTokenMap);
      const sequenceBonus = this.evaluateSequencePatterns(message, this.getSequencePatterns());
      score += (contextBonus + sequenceBonus) * 0.5; // Scale to fit within 10%

      // User Confirmation History Bonus
      const confirmationBonus = this.calculateConfirmationBonus(entry);
      score += confirmationBonus;

      // Debug logging to help troubleshoot matching
      console.log(`Match evaluation for entry ${entry.id.substring(0, 8)}:`, {
        templateSimilarity: templateSimilarity.toFixed(2),
        hashSimilarity: hashSimilarity.toFixed(2),
        senderScore: senderScore.toFixed(2),
        fieldMatchScore: fieldMatchScore.toFixed(2),
        contextBonus: contextBonus.toFixed(2),
        sequenceBonus: sequenceBonus.toFixed(2),
        confirmationBonus: confirmationBonus.toFixed(2),
        totalScore: score.toFixed(2)
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    // Log the final result
    console.log(`Best match found:`, bestMatch ? {
      id: bestMatch.id.substring(0, 8),
      confidence: bestScore.toFixed(2),
      vendor: bestMatch.confirmedFields.vendor,
      amount: bestMatch.confirmedFields.amount
    } : 'No match');

    if (bestMatch && bestScore >= this.config.minConfidenceThreshold) {
      bestMatch.confidence = bestScore;
      return { entry: bestMatch, confidence: bestScore, matched: true };
    }

    return { entry: null, confidence: bestScore, matched: false, shouldTrain: bestScore < TRAIN_MODEL_THRESHOLD };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);
    
    const commonTokens = tokens1.filter(token => tokens2.includes(token));
    return commonTokens.length / Math.max(tokens1.length, tokens2.length);
  }

  private scoreContextHints(message: string, fieldTokenMap: FieldTokenMap): number {
  let score = 0;

  const contextRules: Record<string, string[]> = {
    amount: ['مبلغ', 'amount'],
    currency: ['sar', 'egp', 'usd'],
    vendor: ['لدى', 'vendor', 'merchant', 'from'],
    account: ['بطاقة', 'account', 'card'],
    date: ['في', 'on', 'at']
  };

  Object.entries(fieldTokenMap).forEach(([field, tokens]) => {
    tokens.forEach(token => {
      const beforeTokens = token.context?.before || [];
      if (contextRules[field]) {
        const matched = beforeTokens.some(before =>
          contextRules[field].includes(before.toLowerCase())
        );
        if (matched) {
          score += 0.02; // Small boost per match
        }
      }
    });
  });

  return Math.min(0.1, score); // Cap at 10%
}
private scoreArabicHeuristics(message: string): number {
  const arabicSequence = ['شراء', 'بطاقة', 'مبلغ', 'لدى', 'في'];
  const normalized = this.tokenize(message).join(' ');
  const matched = arabicSequence.filter(token => normalized.includes(token));
  return matched.length >= 4 ? 0.05 : matched.length * 0.01;
}

private compareTemplateHash(newHash: string, existingHash: string): number {
  return this.templateHashSimilarity(newHash, existingHash);
}
  


  private evaluateSequencePatterns(message: string, patterns: SequencePattern[]): number {
    if (patterns.length === 0) return 0;
    
    // Extract all token types with positions
    const amountTokens = this.extractAmountTokensWithPosition(message);
    const currencyTokens = this.extractCurrencyTokensWithPosition(message);
    const vendorTokens = this.extractVendorTokensWithPosition(message);
    const accountTokens = this.extractAccountTokensWithPosition(message);
    const dateTokens = this.extractDateTokensWithPosition(message);
    
    const fieldTokenMap: FieldTokenMap = {
      amount: amountTokens,
      currency: currencyTokens,
      vendor: vendorTokens,
      account: accountTokens,
      date: dateTokens
    };
    
    let patternBonus = 0;
    let patternsEvaluated = 0;
    
    // Check each pattern
    patterns.forEach(pattern => {
      if (pattern.confidence <= 0) return;
      
      const [field1, field2] = pattern.fieldPair;
      const tokens1 = fieldTokenMap[field1 as keyof FieldTokenMap];
      const tokens2 = fieldTokenMap[field2 as keyof FieldTokenMap];
      
      if (!tokens1 || !tokens2 || tokens1.length === 0 || tokens2.length === 0) return;
      
      // Check if the sequence appears in this message
      let patternMatched = false;
      
      if (pattern.sequenceType.includes('precedes')) {
        // field1 should come before field2
        tokens1.forEach(token1 => {
          tokens2.forEach(token2 => {
            if (token1.position < token2.position) {
              patternMatched = true;
            }
          });
        });
      }
      
      if (patternMatched) {
        patternBonus += pattern.confidence * (pattern.confirmedByUser ? 0.15 : 0.1);
        patternsEvaluated++;
      }
    });
    
    // Normalize bonus - higher weight for confirmed patterns, cap at 0.2
    return Math.min(0.2, patternBonus);
  }

  private calculateConfirmationBonus(entry: LearnedEntry): number {
    // Check if entry has confirmation history
    if (!entry.confirmationHistory || entry.confirmationHistory.length === 0) {
      return entry.userConfirmed ? this.config.userConfirmationWeight : 0;
    }
    
    // More weight for entries with multiple confirmations
    const confirmationCount = entry.confirmationHistory.length;
    const userExplicitCount = entry.confirmationHistory.filter(c => c.source === 'user-explicit').length;
    
    // Calculate bonus - more weight for user explicit confirmations
    let bonus = (userExplicitCount * 0.15) + ((confirmationCount - userExplicitCount) * 0.05);
    
    // Cap the bonus
    return Math.min(this.config.userConfirmationWeight, bonus);
  }
  
private calculateConfidenceScore(entry: LearnedEntry, message: string, senderHint: string = ''): number {
  // Initialize score as a let variable to allow reassignment
  let score = 0;

  // STEP 1 – Template Structure Match (40%)
  const templateSimilarity = this.calculateTextSimilarity(entry.rawMessage, message);
  const structureScore = templateSimilarity >= 0.85 ? 0.4 : templateSimilarity * 0.4;
  score += structureScore;

  // STEP 2 – Sender Match + Coupling (20%)
  let senderScore = 0;
  const senderTemplates = this.getSenderTemplates();
  const matchedSender = senderTemplates.find(t =>
    t.sender.toLowerCase() === senderHint.toLowerCase()
  );

  if (matchedSender && matchedSender.confirmationCount > 0) {
    const senderTemplateMatch = matchedSender.templates.some(template => {
      return this.calculateTextSimilarity(template, message) >= 0.8;
    });
    if (senderTemplateMatch) {
      senderScore += 0.2; // Full bonus for matching sender + structure
    } else if (entry.senderHint?.toLowerCase().includes(senderHint.toLowerCase())) {
      senderScore += 0.1; // Partial credit for sender name overlap
    }
  }
  score += senderScore;

  // STEP 3 – Field Token Map Match (20%)
  const fieldMatchScore = this.compareFieldsWithPosition(entry.fieldTokenMap, message);
  score += fieldMatchScore * 0.2;

  // STEP 4 – Contextual Cues (10%)
  const contextBonus = this.scoreContextHints(message, entry.fieldTokenMap);
  score += contextBonus;

  // STEP 5 – Known Sequence Patterns (5%)
  const sequenceBonus = this.evaluateSequencePatterns(message, this.getSequencePatterns());
  score += sequenceBonus;

  // STEP 6 – Arabic Transaction Heuristics (5%)
  const arabicBonus = this.scoreArabicHeuristics(message);
  score += arabicBonus;

  // STEP 7 – User Confirmation History Bonus
  const confirmationBonus = this.calculateConfirmationBonus(entry);
  score += confirmationBonus;

  return Math.min(1.0, score); // Normalize final score
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
    // FIX: Add the global flag 'g' to each regex pattern
    const patterns = [
      { regex: /(?:لدى|from|at|vendor|to)[:\s]*([^\n]+)/gi, group: 1 },
      { regex: /(?:paid to|purchase at|bought from)[:\s]*([^\n]+)/gi, group: 1 }
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
            userConfirmed: true, // Assume all existing entries were user-confirmed
            confirmationHistory: entry.confirmationHistory || [{ 
              timestamp: entry.timestamp || new Date().toISOString(),
              source: 'system-migration'
            }]
          };
        }
        
        // Ensure confirmationHistory exists
        if (!entry.confirmationHistory) {
          return {
            ...entry,
            confirmationHistory: [{
              timestamp: entry.timestamp || new Date().toISOString(),
              source: entry.userConfirmed ? 'user-explicit' : 'system-migration'
            }]
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
    localStorage.removeItem(SENDER_TEMPLATES_KEY);
    localStorage.removeItem(SEQUENCE_PATTERNS_KEY);
  }
}

export const learningEngineService = new LearningEngineService();
