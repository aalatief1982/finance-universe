// This module contains the SMS parsing logic for the expense tracker app
import { transactionService } from '@/services/TransactionService';
import { CategoryRule } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

export interface ParsedTransaction {
  amount: number;
  date: Date;
  sender: string;
  category: string;
  description: string;
  rawMessage: string;
  currency?: SupportedCurrency;
}

// Generic pattern matchers that are not tied to specific banks
const TRANSACTION_PATTERNS = [
  // Generic debit/credit pattern
  {
    regex: /(credit|debit|credited|debited|charged|payment|purchase|transaction|transfer|spent) (?:of|for|with|amount|sum)? ?([₹$€£₺¥₽₴₦₱₲₩₸₼₵฿¢]|SAR|AED|USD|EUR|GBP|EGP|INR|[A-Z]{3})?\s?([0-9,.]+[0-9](?:\.\d{1,2})?)/i,
    isExpense: (matches: RegExpMatchArray, message: string) => {
      const action = matches[1].toLowerCase();
      // Actions that typically indicate expenses
      return ['debit', 'debited', 'charged', 'purchase', 'spent', 'payment'].includes(action) && 
             !message.toLowerCase().includes('received') && 
             !message.toLowerCase().includes('credited to');
    },
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[3].replace(/,/g, '')),
    getCurrency: (matches: RegExpMatchArray, message: string) => {
      // Extract currency from the matches
      const currencySymbol = matches[2] || '';
      
      // Map common currency symbols to currency codes
      const symbolMap: Record<string, SupportedCurrency> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '₹': 'INR',
        'SAR': 'SAR',
        'AED': 'AED',
        'USD': 'USD',
        'EUR': 'EUR',
        'GBP': 'GBP',
        'EGP': 'EGP',
        'INR': 'INR',
        '¥': 'JPY',
        '₽': 'RUB',
        '₺': 'TRY'
      };
      
      // Try to identify currency from the symbol
      let currency = symbolMap[currencySymbol] || null;
      
      // If not found, try to extract from the message content
      if (!currency) {
        const currencyMatch = message.match(/(?:currency|in)\s+([A-Z]{3})/i);
        if (currencyMatch) {
          currency = currencyMatch[1] as SupportedCurrency;
        }
      }
      
      // Default to user's preferred currency if we couldn't detect it
      return currency || getUserPreferredCurrency();
    }
  },
  
  // Pattern for amounts with currency code after the amount (common in many countries)
  {
    regex: /([0-9,.]+[0-9](?:\.\d{1,2})?) ?([₹$€£₺¥₽₴₦₱₲₩₸₼₵฿¢]|SAR|AED|USD|EUR|GBP|EGP|INR|[A-Z]{3})/i,
    isExpense: (matches: RegExpMatchArray, message: string) => {
      // Look for keywords that indicate expenses
      return !message.toLowerCase().includes('received') && 
             !message.toLowerCase().includes('credited') && 
             !message.toLowerCase().includes('income') && 
             !message.toLowerCase().includes('salary') &&
             !message.toLowerCase().includes('deposit');
    },
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[1].replace(/,/g, '')),
    getCurrency: (matches: RegExpMatchArray) => {
      const currencySymbol = matches[2] || '';
      const symbolMap: Record<string, SupportedCurrency> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '₹': 'INR',
        'SAR': 'SAR',
        'AED': 'AED',
        'USD': 'USD',
        'EUR': 'EUR',
        'GBP': 'GBP',
        'EGP': 'EGP',
        'INR': 'INR',
        '¥': 'JPY',
        '₽': 'RUB',
        '₺': 'TRY'
      };
      
      return symbolMap[currencySymbol] || getUserPreferredCurrency();
    }
  },
  
  // Specific pattern for Saudi banks (using both SAR and numbers)
  {
    regex: /(مبلغ|مدين|دائن|سحب|إيداع|دفع).*?([0-9,.]+[0-9](?:\.\d{1,2})?).*?(ريال|SAR|سعودي)/i,
    isExpense: (matches: RegExpMatchArray, message: string) => {
      const action = matches[1].toLowerCase();
      // Arabic terms for debit, withdrawal, payment
      return ['مدين', 'سحب', 'دفع'].includes(action);
    },
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[2].replace(/,/g, '')),
    getCurrency: () => 'SAR' as SupportedCurrency
  },
  
  // Pattern for Egypt banks (using EGP)
  {
    regex: /(amount|purchase|payment|transaction|مبلغ|عملية).*?([0-9,.]+[0-9](?:\.\d{1,2})?).*?(EGP|جنيه|مصري)/i,
    isExpense: (matches: RegExpMatchArray, message: string) => {
      return !message.toLowerCase().includes('received') && 
             !message.toLowerCase().includes('credited');
    },
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[2].replace(/,/g, '')),
    getCurrency: () => 'EGP' as SupportedCurrency
  },
  
  // Pattern for Indian banks (using INR and ₹)
  {
    regex: /(debited|credited|payment|purchase|spent|received|paid).*?(Rs\.?|₹|INR)?\s?([0-9,.]+[0-9](?:\.\d{1,2})?)/i,
    isExpense: (matches: RegExpMatchArray, message: string) => {
      const action = matches[1].toLowerCase();
      return ['debited', 'payment', 'purchase', 'spent', 'paid'].includes(action);
    },
    getAmount: (matches: RegExpMatchArray) => parseFloat(matches[3].replace(/,/g, '')),
    getCurrency: () => 'INR' as SupportedCurrency
  }
];

// Get user's preferred currency from settings or default to USD
function getUserPreferredCurrency(): SupportedCurrency {
  try {
    // Try to get from local storage or another source
    const storedCurrency = localStorage.getItem('user_currency');
    if (storedCurrency) {
      return storedCurrency as SupportedCurrency;
    }
    
    // Try to get from user settings if available
    const userSettings = JSON.parse(localStorage.getItem('user_settings') || '{}');
    if (userSettings && userSettings.currency) {
      return userSettings.currency as SupportedCurrency;
    }
    
    // Default to SAR for Saudi Arabia context
    return 'SAR' as SupportedCurrency;
  } catch (error) {
    console.error('Error getting user currency:', error);
    return 'SAR' as SupportedCurrency;
  }
}

/**
 * Parse an SMS message to extract transaction details
 */
export function parseSmsMessage(message: string, sender: string): ParsedTransaction | null {
  // Try each transaction pattern until one matches
  for (const pattern of TRANSACTION_PATTERNS) {
    const matches = message.match(pattern.regex);
    
    if (matches) {
      const isExpense = pattern.isExpense(matches, message);
      let amount = pattern.getAmount(matches);
      if (isExpense) amount = -Math.abs(amount); // Convert to negative for expenses
      else amount = Math.abs(amount); // Ensure positive for income
      
      const currency = pattern.getCurrency ? pattern.getCurrency(matches, message) : getUserPreferredCurrency();
      const description = extractDescription(message, sender);
      
      // Apply category rules to determine the category
      const category = applyCategoryRules(description, amount, message);
      
      return {
        amount,
        date: extractDateFromMessage(message) || new Date(),
        sender: extractBankName(sender, message), // Dynamically extract bank name
        category,
        description,
        rawMessage: message,
        currency
      };
    }
  }
  
  return null; // No patterns matched
}

/**
 * Extract the bank name from the sender or message content
 */
function extractBankName(sender: string, message: string): string {
  // First check if sender contains a recognizable bank name
  if (sender) {
    // Remove common sender prefixes
    const cleanSender = sender.replace(/^sms from |^msg from |^alert: /i, '').trim();
    
    // If the sender looks like a bank name (not a phone number), use it
    if (!/^\+?\d+$/.test(cleanSender)) {
      return cleanSender;
    }
  }
  
  // Try to extract bank name from the message
  const bankIndicators = [
    // Common international banks
    { name: 'HSBC', patterns: ['hsbc'] },
    { name: 'Citibank', patterns: ['citi', 'citibank'] },
    { name: 'Standard Chartered', patterns: ['standard chartered', 'sc bank'] },
    
    // Saudi banks
    { name: 'Al Rajhi Bank', patterns: ['rajhi', 'الراجحي'] },
    { name: 'Saudi National Bank', patterns: ['snb', 'saudi national', 'البنك الأهلي'] },
    { name: 'Riyad Bank', patterns: ['riyad', 'بنك الرياض'] },
    { name: 'Bank Albilad', patterns: ['albilad', 'البلاد'] },
    { name: 'Alinma Bank', patterns: ['alinma', 'الإنماء'] },
    
    // UAE banks
    { name: 'Emirates NBD', patterns: ['emirates nbd', 'enbd'] },
    { name: 'Abu Dhabi Commercial Bank', patterns: ['adcb'] },
    { name: 'Dubai Islamic Bank', patterns: ['dib'] },
    
    // Egyptian banks
    { name: 'National Bank of Egypt', patterns: ['nbe', 'البنك الأهلي المصري'] },
    { name: 'Banque Misr', patterns: ['banque misr', 'بنك مصر'] },
    { name: 'Commercial International Bank', patterns: ['cib'] },
    
    // Indian banks
    { name: 'State Bank of India', patterns: ['sbi'] },
    { name: 'ICICI Bank', patterns: ['icici'] },
    { name: 'HDFC Bank', patterns: ['hdfc'] },
    { name: 'Axis Bank', patterns: ['axis'] },
    
    // Payment platforms
    { name: 'PayPal', patterns: ['paypal'] },
    { name: 'Venmo', patterns: ['venmo'] },
    { name: 'Cash App', patterns: ['cash app', 'cashapp'] },
    { name: 'STC Pay', patterns: ['stc pay', 'stcpay'] },
    { name: 'Paytm', patterns: ['paytm'] }
  ];
  
  const messageLower = message.toLowerCase();
  
  for (const bank of bankIndicators) {
    for (const pattern of bank.patterns) {
      if (messageLower.includes(pattern)) {
        return bank.name;
      }
    }
  }
  
  // If no bank name found, return a generic name
  return 'Financial Institution';
}

/**
 * Extract a description from the message
 */
function extractDescription(message: string, sender: string): string {
  // Try various patterns to extract a meaningful description
  const patterns = [
    // Look for merchant or location after these prepositions
    { regex: /(?:at|from|to|in) ([A-Za-z0-9\s&.']{3,30})(?:\s|on|for|with|,|\.|$)/i, group: 1 },
    
    // Look for references
    { regex: /(?:ref|reference|txn|trans|transaction)[:\s#-]+([A-Za-z0-9]{3,20})/i, group: 1, prefix: 'Ref: ' },
    
    // Look for purpose or reason
    { regex: /(?:for|purpose|reason)[:\s]+["']?([^"'\n.]{3,40})["']?/i, group: 1 },
    
    // Arabic description patterns
    { regex: /(?:في|من|إلى) ([A-Za-z0-9\s&.']{3,30})/i, group: 1 },
    
    // Look for purchase type
    { regex: /((?:online|card|atm|cash|mobile) (?:purchase|payment|withdrawal|deposit))/i, group: 1 }
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern.regex);
    if (match && match[pattern.group]) {
      const extracted = match[pattern.group].trim();
      return pattern.prefix ? `${pattern.prefix}${extracted}` : extracted;
    }
  }
  
  // Fallback to sender or truncated message
  return sender || (message.length > 50 ? message.substring(0, 50) + '...' : message);
}

/**
 * Attempt to extract a date from the message, supporting international formats
 */
function extractDateFromMessage(message: string): Date | null {
  // Look for common date formats in the message
  const datePatterns = [
    // MM/DD/YYYY or MM/DD
    { regex: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i, groups: [1, 2, 3], format: 'MDY' },
    
    // DD/MM/YYYY or DD/MM (common in many countries including Saudi Arabia, Egypt)
    { regex: /\b(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})\b/i, groups: [1, 2, 3], format: 'DMY' },
    
    // YYYY/MM/DD format
    { regex: /\b(\d{4})[-./](\d{1,2})[-./](\d{1,2})\b/i, groups: [3, 2, 1], format: 'YMD' },
    
    // Month name formats (English)
    { regex: /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{2,4})\b/i, groups: [1, 2, 3], format: 'TEXT_DMY' },
    { regex: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?[\s,]+(\d{2,4})\b/i, groups: [2, 1, 3], format: 'TEXT_MDY' },
    
    // Arabic dates (basic patterns)
    { regex: /(\d{1,2})(?:\s+|\/)(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)(?:\s+|\/)(\d{2,4})/i, groups: [1, 0, 2], format: 'AR_DMY' }
  ];
  
  // Map for month names
  const monthMap: Record<string, number> = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5,
    'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11
  };
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern.regex);
    if (!match) continue;
    
    try {
      let day, month, year;
      
      if (pattern.format === 'MDY') {
        month = parseInt(match[pattern.groups[0]], 10) - 1; // JS months are 0-indexed
        day = parseInt(match[pattern.groups[1]], 10);
        year = match[pattern.groups[2]] ? parseInt(match[pattern.groups[2]], 10) : new Date().getFullYear();
      } else if (pattern.format === 'DMY') {
        day = parseInt(match[pattern.groups[0]], 10);
        month = parseInt(match[pattern.groups[1]], 10) - 1;
        year = match[pattern.groups[2]] ? parseInt(match[pattern.groups[2]], 10) : new Date().getFullYear();
      } else if (pattern.format === 'YMD') {
        day = parseInt(match[pattern.groups[0]], 10);
        month = parseInt(match[pattern.groups[1]], 10) - 1;
        year = parseInt(match[pattern.groups[2]], 10);
      } else if (pattern.format === 'TEXT_DMY' || pattern.format === 'TEXT_MDY') {
        // Handle text month formats
        const monthText = match[pattern.groups[1]].toLowerCase().substring(0, 3);
        month = monthMap[monthText] || 0;
        
        if (pattern.format === 'TEXT_DMY') {
          day = parseInt(match[pattern.groups[0]], 10);
          year = parseInt(match[pattern.groups[2]], 10);
        } else {
          day = parseInt(match[pattern.groups[0]], 10);
          year = parseInt(match[pattern.groups[2]], 10);
        }
      } else if (pattern.format === 'AR_DMY') {
        day = parseInt(match[pattern.groups[0]], 10);
        // Extract the Arabic month name
        const monthText = match[pattern.groups[1]].toLowerCase();
        month = monthMap[monthText] || 0;
        year = parseInt(match[pattern.groups[2]], 10);
      }
      
      // Adjust two-digit years
      if (year < 100) {
        year = year + (year > 50 ? 1900 : 2000);
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.warn('Error parsing date:', error);
    }
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
  
  // Basic categories based on keywords in multiple languages
  const categories = [
    { id: 'Income', 
      isMatch: () => amount > 0,
      keywords: [] },
    
    { id: 'Groceries', 
      keywords: ['grocery', 'market', 'supermarket', 'food', 'بقالة', 'سوبرماركت', 'طعام', 'محل', 'किराना', 'सुपरमार्केट', 'खाद्य'] },
    
    { id: 'Dining', 
      keywords: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'مطعم', 'كافيه', 'قهوة', 'طعام', 'रेस्तरां', 'कैफे', 'खाना'] },
    
    { id: 'Transport', 
      keywords: ['uber', 'lyft', 'taxi', 'transport', 'metro', 'bus', 'car', 'gas', 'fuel', 'نقل', 'تاكسي', 'مترو', 'باص', 'سيارة', 'وقود', 'परिवहन', 'टैक्सी', 'मेट्रो', 'बस', 'कार', 'गैस'] },
    
    { id: 'Entertainment', 
      keywords: ['netflix', 'spotify', 'movie', 'cinema', 'theater', 'entertainment', 'ترفيه', 'سينما', 'مسرح', 'فيلم', 'मनोरंजन', 'सिनेमा', 'थिएटर', 'फिल्म'] },
    
    { id: 'Healthcare', 
      keywords: ['doctor', 'hospital', 'clinic', 'pharmacy', 'medical', 'health', 'طبيب', 'مستشفى', 'عيادة', 'صيدلية', 'صحة', 'डॉक्टर', 'अस्पताल', 'क्लिनिक', 'फार्मेसी', 'स्वास्थ्य'] },
    
    { id: 'Shopping', 
      keywords: ['shop', 'store', 'mall', 'retail', 'clothing', 'electronics', 'تسوق', 'متجر', 'مول', 'ملابس', 'إلكترونيات', 'दुकान', 'स्टोर', 'मॉल', 'कपड़े', 'इलेक्ट्रॉनिक्स'] },
    
    { id: 'Bills', 
      keywords: ['bill', 'utility', 'electric', 'water', 'gas', 'phone', 'internet', 'فاتورة', 'مرافق', 'كهرباء', 'ماء', 'غاز', 'هاتف', 'إنترنت', 'बिल', 'उपयोगिता', 'बिजली', 'पानी', 'गैस', 'फोन', 'इंटरनेट'] },
    
    { id: 'Travel', 
      keywords: ['hotel', 'flight', 'airline', 'travel', 'booking', 'vacation', 'فندق', 'طيران', 'سفر', 'حجز', 'إجازة', 'होटल', 'उड़ान', 'यात्रा', 'बुकिंग', 'छुट्टी'] }
  ];
  
  // Check each category
  for (const category of categories) {
    // Special case for income
    if (category.id === 'Income' && category.isMatch()) {
      return category.id;
    }
    
    // For other categories, check keywords
    for (const keyword of category.keywords) {
      if (description.includes(keyword)) {
        return category.id;
      }
    }
  }
  
  return 'Miscellaneous';
}

/**
 * Get a mock list of SMS messages for testing, supporting international formats
 */
export function getMockSmsMessages() {
  return [
    // Original mock messages
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
    
    // Saudi messages
    {
      id: '6',
      sender: 'Al Rajhi Bank',
      message: 'عملية شراء بمبلغ 175.50 ريال سعودي في سوبرماركت العثيم بتاريخ 07/05/2023',
      date: new Date('2023-05-07T09:30:00'),
    },
    {
      id: '7',
      sender: 'Saudi National Bank',
      message: 'SNB: Purchase transaction SAR 223.75 at PANDA HYPERMARKET on 08-05-2023',
      date: new Date('2023-05-08T13:45:00'),
    },
    
    // Egyptian messages
    {
      id: '8',
      sender: 'CIB Egypt',
      message: 'CIB: Your card has been debited with EGP 350.00 at CARREFOUR EGYPT on 09/05/2023',
      date: new Date('2023-05-09T12:20:00'),
    },
    {
      id: '9',
      sender: 'NBE',
      message: 'تم خصم مبلغ 125.75 جنيه مصري من حسابك لعملية شراء في اولاد رجب بتاريخ 10-05-2023',
      date: new Date('2023-05-10T16:10:00'),
    },
    
    // Indian messages
    {
      id: '10',
      sender: 'HDFC Bank',
      message: 'HDFC: INR 1,450.00 has been debited from your account for purchase at BIG BAZAAR on 11-05-2023',
      date: new Date('2023-05-11T11:05:00'),
    },
    {
      id: '11',
      sender: 'SBI',
      message: 'SBI: Your account XX7890 is debited with Rs.550.50 on 12-05-2023 at RELIANCE FRESH',
      date: new Date('2023-05-12T09:15:00'),
    },
    
    // UAE messages
    {
      id: '12',
      sender: 'Emirates NBD',
      message: 'ENBD: AED 275.00 was spent on your card at CARREFOUR DUBAI on 13/05/2023',
      date: new Date('2023-05-13T15:30:00'),
    },
    
    // Generic messages
    {
      id: '13',
      sender: 'STC Pay',
      message: 'Your STC Pay wallet has been debited with SAR 100.00 for payment to Muhammad Ali on 14/05/2023',
      date: new Date('2023-05-14T14:25:00'),
    },
    {
      id: '14',
      sender: '+123456789',
      message: 'Transaction alert: Purchase of 45.75 USD at STARBUCKS JEDDAH on 15/05/2023',
      date: new Date('2023-05-15T08:40:00'),
    },
    {
      id: '15',
      sender: 'Bank Alert',
      message: 'Payment of EUR 95.20 to ONLINE MERCHANT on 16-05-2023 has been completed',
      date: new Date('2023-05-16T17:50:00'),
    },
  ];
}
