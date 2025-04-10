
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType } from '@/types/transaction';
import { ErrorType } from '@/types/error';
import { handleError } from '@/utils/error-utils';

class MessageProcessingService {
  // Main method to process message text
  processMessageText(messageText: string): Transaction | null {
    try {
      // Extract transaction data from text
      const amountInfo = this.extractAmount(messageText);
      if (!amountInfo) return null;
      
      const { amount, currency } = amountInfo;
      
      // Determine transaction type (expense or income)
      const type = this.determineTransactionType(messageText, amount);
      
      // Extract other details
      const title = this.extractTitle(messageText) || 'Transaction';
      const category = this.suggestCategory(messageText, type);
      const date = this.extractDate(messageText) || new Date().toISOString().split('T')[0];
      const fromAccount = this.extractAccount(messageText) || 'Main Account';
      
      // Create transaction object
      const transaction: Transaction = {
        id: uuidv4(),
        title,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        category,
        date,
        type,
        source: 'manual', // Manual since it's pasted by user
        notes: `Extracted from: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
        fromAccount,
        currency: currency || 'USD'
      };
      
      return transaction;
    } catch (error) {
      handleError({
        type: ErrorType.PARSING,
        message: 'Failed to parse transaction from message text',
        originalError: error
      });
      return null;
    }
  }
  
  // Extract amount from message text
  private extractAmount(text: string): { amount: number; currency?: string } | null {
    try {
      // Common patterns for currency amounts
      const patterns = [
        // Format: $123.45 or $123
        /(\$|€|£|¥|₹|₽|₺|₴|₸|₿|SAR|AED|USD|EUR|GBP|EGP)\s?([0-9,]+(\.[0-9]{1,2})?)/i,
        
        // Format: 123.45$ or 123$
        /([0-9,]+(\.[0-9]{1,2})?)\s?(\$|€|£|¥|₹|₽|₺|₴|₸|₿|SAR|AED|USD|EUR|GBP|EGP)/i,
        
        // Format: Amount: 123.45
        /amount\s*[:of]*\s*(\$|€|£|¥|₹|₽|₺|₴|₸|₿|SAR|AED|USD|EUR|GBP|EGP)?\s*([0-9,]+(\.[0-9]{1,2})?)/i,
        
        // Format: 123.45 SR
        /([0-9,]+(\.[0-9]{1,2})?)\s*(SR|ر\.س|ريال|dollar|dollars|euro|euros|pound|pounds)/i,
        
        // Format: pure number (fallback)
        /([0-9,]+(\.[0-9]{1,2})?)/
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          let amount: number;
          let currency: string | undefined;
          
          // Different capturing groups based on pattern
          if (pattern.source.startsWith('(\\$|€|£')) {
            currency = match[1];
            amount = parseFloat(match[2].replace(/,/g, ''));
          } else if (pattern.source.includes('amount')) {
            currency = match[1] || undefined;
            amount = parseFloat(match[2].replace(/,/g, ''));
          } else if (pattern.source.startsWith('([0-9,]+')) {
            amount = parseFloat(match[1].replace(/,/g, ''));
            currency = match[3] || undefined;
            
            // Map currency names to codes
            if (currency) {
              const currencyMap: Record<string, string> = {
                'SR': 'SAR',
                'ر.س': 'SAR',
                'ريال': 'SAR',
                'dollar': 'USD',
                'dollars': 'USD',
                'euro': 'EUR',
                'euros': 'EUR',
                'pound': 'GBP',
                'pounds': 'GBP'
              };
              
              currency = currencyMap[currency.toLowerCase()] || currency;
            }
          } else {
            amount = parseFloat(match[1].replace(/,/g, ''));
          }
          
          // Detect fixed common currencies
          if (!currency) {
            const currencyPatterns = [
              { currency: 'SAR', patterns: ['sar', 'sr', 'riyal', 'ريال'] },
              { currency: 'USD', patterns: ['usd', 'dollar', 'dollars', '$'] },
              { currency: 'EUR', patterns: ['eur', 'euro', 'euros', '€'] },
              { currency: 'GBP', patterns: ['gbp', 'pound', 'pounds', '£'] },
              { currency: 'EGP', patterns: ['egp', 'egyptian pound', 'جنيه', 'le'] }
            ];
            
            const lowerText = text.toLowerCase();
            for (const { currency: curr, patterns } of currencyPatterns) {
              if (patterns.some(pattern => lowerText.includes(pattern))) {
                currency = curr;
                break;
              }
            }
          }
          
          return { amount, currency };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting amount:', error);
      return null;
    }
  }
  
  // Determine if transaction is expense or income
  private determineTransactionType(text: string, amount: number): TransactionType {
    const lowerText = text.toLowerCase();
    
    // Keywords suggesting income
    const incomeKeywords = [
      'received', 'salary', 'deposit', 'deposited', 'credit', 'credited',
      'refund', 'reimbursement', 'payment received', 'paid to you', 'transfer to',
      'incoming', 'income', 'پرداخت به', 'واریز', 'دریافت'
    ];
    
    // Keywords suggesting expense
    const expenseKeywords = [
      'paid', 'purchase', 'payment', 'withdrawal', 'spent', 'debit', 'debited',
      'charge', 'fee', 'subscription', 'deducted', 'transfer from', 'sent',
      'expense', 'پرداخت از', 'برداشت', 'خرید'
    ];
    
    // Check for income keywords
    for (const keyword of incomeKeywords) {
      if (lowerText.includes(keyword)) {
        return 'income';
      }
    }
    
    // Check for expense keywords
    for (const keyword of expenseKeywords) {
      if (lowerText.includes(keyword)) {
        return 'expense';
      }
    }
    
    // Default: expense
    return 'expense';
  }
  
  // Extract merchant name or transaction description
  private extractTitle(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    // Try to find merchant name patterns
    const merchantPatterns = [
      /(?:at|from|to)\s+([A-Za-z0-9\s&.,']+?)(?:\s+on|\s+for|\s+amount|\s+\d|$)/i,
      /(?:purchase|payment|transaction|paid)(?:\s+at|\s+to|\s+from|\s+for)?\s+([A-Za-z0-9\s&.,']+?)(?:\s+on|\s+for|\s+amount|\s+\d|$)/i,
      /(?:merchant|vendor|shop|store):\s*([A-Za-z0-9\s&.,']+?)(?:\s+on|\s+for|\s+amount|\s+\d|$)/i
    ];
    
    for (const pattern of merchantPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Try to find any meaningful title
    let title = null;
    
    // Match words after common prefixes
    const prefixes = ['purchase', 'payment', 'transaction', 'transfer', 'bill payment', 'subscription'];
    for (const prefix of prefixes) {
      if (lowerText.includes(prefix)) {
        const startIndex = lowerText.indexOf(prefix) + prefix.length;
        const nextSentence = text.slice(startIndex, startIndex + 50);
        const firstWords = nextSentence.split(/[.,;:\n]/).shift();
        
        if (firstWords && firstWords.length > 3) {
          title = firstWords.trim();
          break;
        }
      }
    }
    
    return title;
  }
  
  // Suggest category based on keywords
  private suggestCategory(text: string, type: TransactionType): string {
    const lowerText = text.toLowerCase();
    
    // Define category mapping - keywords to categories
    const categoryKeywords: Record<string, string[]> = {
      'Food & Dining': [
        'restaurant', 'café', 'cafe', 'dining', 'food', 'grocery', 'groceries', 'supermarket',
        'lunch', 'dinner', 'breakfast', 'meal', 'takeout', 'takeaway', 'pizza', 'burger', 
        'starbucks', 'mcdonald', 'kfc', 'subway'
      ],
      'Transportation': [
        'transport', 'uber', 'lyft', 'taxi', 'cab', 'train', 'bus', 'subway', 'metro', 'gas',
        'petrol', 'fuel', 'parking', 'toll', 'car', 'vehicle', 'rental'
      ],
      'Shopping': [
        'shopping', 'purchase', 'amazon', 'shop', 'store', 'mall', 'retail', 'clothes', 'clothing',
        'shoes', 'electronics', 'accessories', 'furniture', 'home', 'appliance', 'hardware'
      ],
      'Bills & Utilities': [
        'bill', 'utility', 'electric', 'electricity', 'water', 'gas', 'internet', 'phone',
        'mobile', 'tv', 'cable', 'subscription', 'service', 'insurance'
      ],
      'Health & Medical': [
        'health', 'doctor', 'hospital', 'clinic', 'medical', 'pharmacy', 'medicine', 'drug',
        'prescription', 'dental', 'dentist', 'optometrist', 'eye', 'healthcare'
      ],
      'Entertainment': [
        'entertainment', 'movie', 'cinema', 'theatre', 'theater', 'concert', 'show', 'event',
        'ticket', 'park', 'game', 'club', 'bar', 'pub', 'alcohol', 'streaming', 'netflix',
        'spotify', 'music', 'app store', 'play store'
      ],
      'Travel': [
        'travel', 'hotel', 'flight', 'airline', 'airbnb', 'booking', 'vacation', 'holiday',
        'trip', 'tour', 'resort', 'accommodation', 'hostel'
      ],
      'Education': [
        'education', 'school', 'college', 'university', 'course', 'class', 'tuition',
        'book', 'textbook', 'student', 'learning', 'training', 'workshop'
      ],
      'Income': [
        'salary', 'wage', 'payment received', 'deposit', 'refund', 'rebate', 'reimbursement',
        'dividend', 'interest', 'credit', 'transfer to', 'income'
      ],
      'Transfer': [
        'transfer', 'move', 'sent', 'received'
      ]
    };
    
    // If it's income, use Income category
    if (type === 'income') {
      return 'Income';
    }
    
    // Check text against category keywords
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return category;
        }
      }
    }
    
    // Default category
    return 'Uncategorized';
  }
  
  // Extract date from message
  private extractDate(text: string): string | null {
    try {
      // Try to match common date formats
      const datePatterns = [
        // MM/DD/YYYY or DD/MM/YYYY
        /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/,
        
        // Month name formats: Jan 02, 2023 or 02 Jan 2023
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{2,4})/i,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[\s,]+(\d{2,4})/i,
        
        // Words like "today", "yesterday"
        /\b(today|yesterday)\b/i,
        
        // Relative time like "2 hours ago", "5 minutes ago"
        /(\d+)\s+(hour|minute|second|day|week|month)s?\s+ago/i
      ];
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          let date: Date;
          
          if (pattern.source.includes('today|yesterday')) {
            // Handle "today" or "yesterday"
            date = new Date();
            if (match[1].toLowerCase() === 'yesterday') {
              date.setDate(date.getDate() - 1);
            }
          } else if (pattern.source.includes('hour|minute|second|day|week|month')) {
            // Handle relative time
            date = new Date();
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            
            switch (unit) {
              case 'second':
              case 'seconds':
                date.setSeconds(date.getSeconds() - value);
                break;
              case 'minute':
              case 'minutes':
                date.setMinutes(date.getMinutes() - value);
                break;
              case 'hour':
              case 'hours':
                date.setHours(date.getHours() - value);
                break;
              case 'day':
              case 'days':
                date.setDate(date.getDate() - value);
                break;
              case 'week':
              case 'weeks':
                date.setDate(date.getDate() - (value * 7));
                break;
              case 'month':
              case 'months':
                date.setMonth(date.getMonth() - value);
                break;
            }
          } else if (pattern.source.includes('Jan|Feb|Mar')) {
            // Handle month name formats
            let day: number, month: number, year: number;
            
            if (/^\d{1,2}\s+/.test(match[0])) {
              // Format: 02 Jan 2023
              day = parseInt(match[1]);
              month = this.getMonthNumber(match[2]);
              year = parseInt(match[3]);
            } else {
              // Format: Jan 02, 2023
              day = parseInt(match[2]);
              month = this.getMonthNumber(match[1]);
              year = parseInt(match[3]);
            }
            
            // Handle 2-digit year
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }
            
            date = new Date(year, month - 1, day);
          } else {
            // Handle numeric formats (MM/DD/YYYY or DD/MM/YYYY)
            const parts = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
            
            // Try to determine format based on values
            let day: number, month: number, year: number;
            
            if (parts[0] > 12 && parts[1] <= 12) {
              // First number > 12, must be DD/MM/YYYY
              day = parts[0];
              month = parts[1];
            } else if (parts[1] > 12 && parts[0] <= 12) {
              // Second number > 12, must be MM/DD/YYYY
              month = parts[0];
              day = parts[1];
            } else {
              // Ambiguous, use MM/DD as default
              month = parts[0];
              day = parts[1];
            }
            
            year = parts[2];
            
            // Handle 2-digit year
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }
            
            date = new Date(year, month - 1, day);
          }
          
          // Format as YYYY-MM-DD
          return date.toISOString().split('T')[0];
        }
      }
      
      // No date found, return today
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('Error extracting date:', error);
      return null;
    }
  }
  
  // Helper to get month number from name
  private getMonthNumber(monthName: string): number {
    const months: Record<string, number> = {
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    };
    
    return months[monthName.toLowerCase().substring(0, 3)] || 1;
  }
  
  // Extract account information
  private extractAccount(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    // Account patterns
    const accountPatterns = [
      /(?:from|debited from|withdrawn from)\s+(?:your\s+)?([A-Za-z\s]+\s+(?:account|card|ac|a\/c))(?:\s+|$)/i,
      /(?:your|from)\s+([A-Za-z]+\s+(?:card|account|ac|a\/c))(?:\s+ending|:\s*\d|\s+\*+|\s+x+)/i,
      /(?:acct|account|card)\s*(?:no|number|#)?(?:\s*:\s*|\s+)(?:[*xX\d]+\s+)?([A-Za-z]+\s+(?:card|account|ac|a\/c)|[A-Za-z]+)/i,
      /(?:from|debited from|withdrawn from)\s+([A-Za-z\s]+)(?:\s+|$)/i
    ];
    
    for (const pattern of accountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Look for common bank/account keywords
    const accountKeywords = [
      'savings', 'checking', 'current', 'credit card', 'debit card', 
      'visa', 'mastercard', 'amex', 'american express', 'discover'
    ];
    
    for (const keyword of accountKeywords) {
      if (lowerText.includes(keyword)) {
        // Capitalize first letter of each word
        return keyword.replace(/\b\w/g, char => char.toUpperCase());
      }
    }
    
    return null;
  }
}

export const messageProcessingService = new MessageProcessingService();
