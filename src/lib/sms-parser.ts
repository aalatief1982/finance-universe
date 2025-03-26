
// This module contains the SMS parsing logic for the expense tracker app

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
    getCategory: (message: string) => {
      if (message.includes('salary') || message.includes('payroll')) return 'Income';
      if (message.includes('grocery') || message.includes('supermarket')) return 'Groceries';
      if (message.includes('restaurant') || message.includes('cafe')) return 'Dining';
      return 'Miscellaneous';
    }
  },
  {
    bank: "Credit Card XYZ",
    regex: /(Purchase|Payment) of (\$|USD) ?([0-9,]+\.\d{2}) at (.+) on/i,
    isExpense: (matches: RegExpMatchArray) => matches[1].toLowerCase() === 'purchase',
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[3].replace(/,/g, '')),
    getCategory: (message: string, matches: RegExpMatchArray) => {
      const merchant = matches[4].toLowerCase();
      if (merchant.includes('amazon') || merchant.includes('store')) return 'Shopping';
      if (merchant.includes('uber') || merchant.includes('lyft')) return 'Transport';
      if (merchant.includes('netflix') || merchant.includes('spotify')) return 'Entertainment';
      return 'Miscellaneous';
    }
  },
  {
    bank: "Investment Corp",
    regex: /Dividend of (\$|USD) ?([0-9,]+\.\d{2}) has been (credited|deposited)/i,
    isExpense: () => false, // Dividends are always income
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[2].replace(/,/g, '')),
    getCategory: () => 'Investments'
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
      
      const category = pattern.getCategory(message, matches);
      
      return {
        amount,
        date: new Date(), // In a real app, try to extract the date from the message
        sender: pattern.bank,
        category,
        description: extractDescription(message, sender),
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
