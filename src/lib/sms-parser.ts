// This module contains the SMS parsing logic for the expense tracker app
import { transactionService } from '@/services/TransactionService';
import { CategoryRule } from '@/types/transaction';

export interface ParsedTransaction {
  amount: number;
  date: Date;
  sender: string;
  category: string;
  description: string;
  rawMessage: string;
}

// Mock patterns for different bank SMS formats
const BANK_PATTERNS = [
  {
    bank: "Bank ABC",
    regex: /Your account has been (credited|debited) with (\$|USD) ?([0-9,]+\.\d{2})/i,
    isExpense: (matches: RegExpMatchArray) => matches[1].toLowerCase() === 'debited',
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[3].replace(/,/g, '')),
    getDescription: (message: string) => {
      const merchantMatch = message.match(/at ([A-Za-z0-9\s&]+) on/i);
      return merchantMatch ? merchantMatch[1].trim() : "Bank Transaction";
    }
  },
  {
    bank: "Credit Card XYZ",
    regex: /(Purchase|Payment) of (\$|USD) ?([0-9,]+\.\d{2}) at (.+) on/i,
    isExpense: (matches: RegExpMatchArray) => matches[1].toLowerCase() === 'purchase',
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[3].replace(/,/g, '')),
    getDescription: (message: string, matches: RegExpMatchArray) => matches[4].trim()
  },
  {
    bank: "Investment Corp",
    regex: /Dividend of (\$|USD) ?([0-9,]+\.\d{2}) has been (credited|deposited)/i,
    isExpense: () => false, // Dividends are always income
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[2].replace(/,/g, '')),
    getDescription: () => "Dividend Payment"
  }
];

/**
 * Parse an SMS message to extract transaction details
 */
export function parseSmsMessage(message: string, sender: string): ParsedTransaction | null {
  // Try each bank pattern until one matches
  for (const pattern of BANK_PATTERNS) {
    const matches = message.match(pattern.regex);
    
    if (matches) {
      const isExpense = pattern.isExpense(matches);
      let amount = pattern.getAmount(matches);
      if (isExpense) amount = -amount; // Convert to negative for expenses

      const description = pattern.getDescription ? 
        pattern.getDescription(message, matches) : 
        extractDescription(message, sender);
      
      // Apply category rules to determine the category
      const category = applyCategoryRules(description, amount, message);
      
      return {
        amount,
        date: extractDateFromMessage(message) || new Date(),
        sender: pattern.bank,
        category,
        description,
        rawMessage: message
      };
    }
  }
  
  return null; // No patterns matched
}

/**
 * Extract a description from the message
 */
function extractDescription(message: string, sender: string): string {
  // Try to extract merchant name or transaction description
  // This is a simplified version - a real implementation would be more sophisticated
  
  // Check for common patterns like "at MERCHANT_NAME"
  const merchantMatch = message.match(/at ([A-Za-z0-9\s&]+) on/i);
  if (merchantMatch) return merchantMatch[1].trim();
  
  // Check for reference numbers
  const refMatch = message.match(/ref[:\s#]+([A-Za-z0-9]+)/i);
  if (refMatch) return `Reference: ${refMatch[1]}`;
  
  // Fallback to truncated message
  return message.length > 50 ? message.substring(0, 50) + '...' : message;
}

/**
 * Attempt to extract a date from the message
 */
function extractDateFromMessage(message: string): Date | null {
  // Look for common date formats in the message
  
  // Format: MM/DD or MM/DD/YYYY
  const dateMatch1 = message.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dateMatch1) {
    const month = parseInt(dateMatch1[1], 10) - 1; // JS months are 0-indexed
    const day = parseInt(dateMatch1[2], 10);
    const year = dateMatch1[3] ? parseInt(dateMatch1[3], 10) : new Date().getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    
    const date = new Date(fullYear, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Format: DD-MM-YYYY or variations
  const dateMatch2 = message.match(/\b(\d{1,2})[.-](\d{1,2})[.-](\d{2,4})\b/);
  if (dateMatch2) {
    const day = parseInt(dateMatch2[1], 10);
    const month = parseInt(dateMatch2[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(dateMatch2[3], 10);
    const fullYear = year < 100 ? 2000 + year : year;
    
    const date = new Date(fullYear, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Format: "on January 15" or similar
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthPattern = months.join('|');
  const dateMatch3 = message.match(new RegExp(`\\b(?:on|date)\\s+(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
  
  if (dateMatch3) {
    const month = months.indexOf(dateMatch3[1].toLowerCase());
    const day = parseInt(dateMatch3[2], 10);
    const year = new Date().getFullYear(); // Assume current year
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null; // Couldn't extract date
}

/**
 * Apply category rules to determine the transaction category
 */
function applyCategoryRules(description: string, amount: number, rawMessage: string): string {
  // Get the category rules from the transaction service
  const rules = transactionService.getCategoryRules();
  
  // Combine all text fields for matching
  const textToMatch = [description, rawMessage]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  // Sort rules by priority (higher priority first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  
  // Try to match rules in priority order
  for (const rule of sortedRules) {
    let isMatch = false;
    
    if (rule.isRegex) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        isMatch = regex.test(textToMatch);
      } catch (err) {
        console.error('Invalid regex pattern in category rule:', rule.pattern);
      }
    } else {
      isMatch = textToMatch.includes(rule.pattern.toLowerCase());
    }
    
    if (isMatch) {
      return rule.categoryId;
    }
  }
  
  // If no rule matches, use basic categorization
  return categorizeTransaction(description, amount);
}

/**
 * Categorize a transaction based on description and amount
 */
export function categorizeTransaction(description: string, amount: number): string {
  description = description.toLowerCase();
  
  // Basic categorization rules
  if (amount > 0) return 'Income';
  
  if (description.includes('grocery') || description.includes('market')) return 'Groceries';
  if (description.includes('restaurant') || description.includes('cafe') || description.includes('food')) return 'Dining';
  if (description.includes('uber') || description.includes('lyft') || description.includes('taxi') || description.includes('transport')) return 'Transport';
  if (description.includes('netflix') || description.includes('spotify') || description.includes('movie') || description.includes('entertainment')) return 'Entertainment';
  if (description.includes('doctor') || description.includes('pharmacy') || description.includes('hospital') || description.includes('medical')) return 'Healthcare';
  
  return 'Miscellaneous';
}

/**
 * Get a mock list of SMS messages for testing
 */
export function getMockSmsMessages() {
  return [
    {
      id: '1',
      sender: 'Bank ABC',
      message: 'Your account has been debited with $125.40 for purchase at GROCERY STORE on 05/01.',
      date: new Date('2023-05-01T10:30:00'),
    },
    {
      id: '2',
      sender: 'Credit Card XYZ',
      message: 'Purchase of $75.20 at AMAZON.COM on 05/02. Available balance: $3,240.60',
      date: new Date('2023-05-02T14:15:00'),
    },
    {
      id: '3',
      sender: 'Bank ABC',
      message: 'Your account has been credited with $2,500.00 from ACME PAYROLL on 05/03.',
      date: new Date('2023-05-03T09:00:00'),
    },
    {
      id: '4',
      sender: 'Investment Corp',
      message: 'Dividend of $37.50 has been credited to your account on 05/04.',
      date: new Date('2023-05-04T16:45:00'),
    },
    {
      id: '5',
      sender: 'Credit Card XYZ',
      message: 'Purchase of $12.99 at NETFLIX.COM on 05/05. Available balance: $3,227.61',
      date: new Date('2023-05-05T20:30:00'),
    },
  ];
}
