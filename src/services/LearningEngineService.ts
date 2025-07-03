
type TokenLabels = Record<string, string>;
import { Transaction } from '@/types/transaction';
import { LearnedEntry, LearningEngineConfig, MatchResult, PositionedToken } from '@/types/learning';

/**
 * LearningEngineService.ts
 *
 * This service is responsible for analyzing text and suggesting transaction details.
 * It uses a combination of token analysis and rule-based logic to infer transaction properties.
 */

/**
 * Determines the transaction type (income/expense) based on token analysis.
 * @param tokens - TokenLabels object containing labeled tokens from the text.
 * @returns 'income' or 'expense' based on the presence of relevant keywords.
 */
export function determineType(tokens: TokenLabels): 'income' | 'expense' {
  const incomeKeywords = ['received', 'deposited', 'credit'];
  const expenseKeywords = ['paid', 'spent', 'debit', 'withdrawal'];

  for (const token in tokens) {
    const label = tokens[token];
    if (label === 'keyword') {
      const lowerToken = token.toLowerCase();
      if (incomeKeywords.includes(lowerToken)) return 'income';
      if (expenseKeywords.includes(lowerToken)) return 'expense';
    }
  }

  // Default to expense if no clear indicator is found
  return 'expense';
}

/**
 * Extracts the transaction amount from the labeled tokens.
 * @param tokens - TokenLabels object containing labeled tokens from the text.
 * @returns The numerical amount found in the tokens, or null if not found.
 */
export function determineAmount(tokens: TokenLabels): number | null {
  for (const token in tokens) {
    if (tokens[token] === 'amount') {
      const num = parseFloat(token.replace(/,/g, ''));
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

/**
 * Determines the currency from the labeled tokens.
 * @param tokens - TokenLabels object containing labeled tokens from the text.
 * @returns The currency symbol or code found in the tokens, or null if not found.
 */
export function determineCurrency(tokens: TokenLabels): string | null {
  for (const token in tokens) {
    if (tokens[token] === 'currency') {
      return token;
    }
  }
  return null;
}

/**
 * Infers transaction details from the labeled tokens.
 * @param tokens - TokenLabels object containing labeled tokens from the text.
 * @returns A partial Transaction object with inferred details.
 */
export function determineTransaction(tokens: TokenLabels): Partial<Transaction> {
  const result: Partial<Transaction> = {
    type: determineType(tokens),
    amount: determineAmount(tokens),
    category: 'Uncategorized',
    account: 'Cash', // Add default account
	fromAccount: 'Cash',
    currency: determineCurrency(tokens) || 'USD',
  };

  // Extract other relevant information based on labels
  for (const token in tokens) {
    if (tokens[token] === 'vendor' && !result.title) {
      result.title = token;
    }
    if (tokens[token] === 'account' && !result.account) {
      result.account = token;
    }
  }

  return result;
}

/**
 * Analyzes a raw text message and suggests transaction details.
 * @param rawMessage - The raw text message to analyze.
 * @returns A partial Transaction object with suggested details.
 */
export function suggestTransactionDetails(rawMessage: string): Partial<Transaction> {
  // 1. Tokenize the message
  const tokens = rawMessage.split(/\s+/);

  // 2. Label tokens (This is a placeholder; replace with actual ML/rule-based labeling)
  const tokenLabels: TokenLabels = {};
  tokens.forEach(token => {
    // Very basic labeling for demonstration
    if (token.match(/^\d+(\.\d{2})?$/)) {
      tokenLabels[token] = 'amount';
    } else if (['USD', 'EUR', 'SAR'].includes(token)) {
      tokenLabels[token] = 'currency';
    } else {
      tokenLabels[token] = 'keyword';
    }
  });

  // 3. Determine transaction details
  const suggestedDetails = determineTransaction(tokenLabels);

  return suggestedDetails;
}

// Mock implementations of missing methods to fix the type errors
function learnFromTransaction(rawMessage: string, transaction: Transaction, senderHint?: string, customFieldTokenMap?: any): void {
  console.log('Learning from transaction:', transaction);
}

function findBestMatch(message: string, senderHint?: string): MatchResult {
  return { entry: null, confidence: 0, matched: false };
}

function inferFieldsFromText(message: string): Partial<Transaction> | null {
  return suggestTransactionDetails(message);
}

function saveConfig(config: Partial<LearningEngineConfig>): void {
  console.log('Saving config:', config);
}

function getLearnedEntries(): LearnedEntry[] {
  return [];
}

function clearLearnedEntries(): void {
  console.log('Clearing learned entries');
}

function tokenize(msg: string): string[] {
  return msg.split(/\s+/);
}

function extractAmountTokensWithPosition(msg: string): PositionedToken[] {
  return [];
}

function extractCurrencyTokensWithPosition(msg: string): PositionedToken[] {
  return [];
}

function extractVendorTokensWithPosition(msg: string): PositionedToken[] {
  return [];
}

function extractAccountTokensWithPosition(msg: string): PositionedToken[] {
  return [];
}

function matchUsingTemplateStructure(text: string): any {
  return null;
}

export const learningEngineService = {
  determineType,
  determineAmount,
  determineCurrency,
  determineTransaction,
  suggestTransactionDetails,
  getConfig: () => ({
    enabled: true,
    saveAutomatically: true,
    maxEntries: 100,
    minConfidenceThreshold: 0.7
  }),
  learnFromTransaction,
  findBestMatch,
  inferFieldsFromText,
  saveConfig,
  getLearnedEntries,
  clearLearnedEntries,
  tokenize,
  extractAmountTokensWithPosition,
  extractCurrencyTokensWithPosition,
  extractVendorTokensWithPosition,
  extractAccountTokensWithPosition,
  matchUsingTemplateStructure,
  saveUserTraining: (data: any) => console.log('Saving user training:', data)
};
