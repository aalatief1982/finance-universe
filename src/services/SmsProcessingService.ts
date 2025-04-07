
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { Capacitor } from '@capacitor/core';
import { SmsMessage } from './NativeSmsService';

class SmsProcessingService {
  /**
   * Process SMS messages in batches to extract transactions
   * @param messages Array of SMS messages to process
   * @param onProgress Optional callback to report progress
   * @returns Array of extracted transactions
   */
  processTransactionsFromSMS(
    messages: { sender: string; message: string; date: Date }[],
    onProgress?: (processed: number, total: number) => void
  ): Transaction[] {
    console.log(`Processing ${messages.length} SMS messages for transactions`);
    
    // Process the SMS messages to extract transaction data
    const transactions: Transaction[] = [];
    const batchSize = 10; // Process messages in batches of 10
    const totalBatches = Math.ceil(messages.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, messages.length);
      const batch = messages.slice(start, end);
      
      console.log(`Processing batch ${i+1}/${totalBatches} (${batch.length} messages)`);
      
      // Process current batch
      const batchTransactions = this.processBatch(batch);
      transactions.push(...batchTransactions);
      
      // Report progress if callback provided
      if (onProgress) {
        onProgress(end, messages.length);
      }
    }
    
    console.log(`Extracted ${transactions.length} transactions from ${messages.length} SMS messages`);
    return transactions;
  }
  
  /**
   * Process a batch of SMS messages to extract transactions
   * @param batch Array of SMS messages to process
   * @returns Array of extracted transactions
   */
  private processBatch(batch: { sender: string; message: string; date: Date }[]): Transaction[] {
    return batch.map(msg => {
      // Extract transaction details from SMS
      const { amount, title, category, type, currency } = this.extractTransactionDetails(msg.message, msg.sender);
      
      // Skip if no amount was detected
      if (amount === 0) {
        console.log(`No transaction amount detected in message from ${msg.sender}`);
        return null;
      }
      
      // Create a transaction object
      const transaction: Transaction = {
        id: uuidv4(),
        title: title || msg.sender,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount), // Apply sign based on type
        category: category || (type === 'expense' ? 'Uncategorized Expense' : 'Uncategorized Income'),
        date: msg.date.toISOString().split('T')[0],
        type: type || (amount >= 0 ? 'income' : 'expense'),
        source: 'sms',
        smsDetails: {
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.date.toISOString()
        },
        currency: currency || 'SAR', // Default currency
        fromAccount: this.extractAccountInfo(msg.message, msg.sender) || 'Bank Account',
      };
      
      console.log('Extracted transaction:', {
        title: transaction.title,
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        currency: transaction.currency
      });
      
      return transaction;
    }).filter(tx => tx !== null) as Transaction[]; // Filter out null transactions
  }
  
  // Helper method to extract transaction details from SMS
  private extractTransactionDetails(message: string, sender: string): { 
    amount: number; 
    title?: string; 
    category?: string; 
    type?: 'income' | 'expense';
    currency?: string;
  } {
    const messageLower = message.toLowerCase();
    
    // Extract amount
    let amount = 0;
    let currency = this.detectCurrency(message);
    
    // Try different amount patterns
    const amountPatterns = [
      // Match currency symbol/code followed by amount: $100.00, SAR 100.00
      /(\$|SAR|AED|EGP|INR|USD|EUR|SR|Rs\.?|ر\.?س\.?|د\.?إ\.?|ج\.?م\.?|₹|€|\$)\s?(\d+(?:[.,]\d+)?)/i,
      
      // Match amount followed by currency: 100.00 USD, 100,00 EUR
      /(\d+(?:[.,]\d+)?)\s?(\$|SAR|AED|EGP|INR|USD|EUR|SR|Rs\.?|ر\.?س\.?|د\.?إ\.?|ج\.?م\.?|₹|€|\$)/i,
      
      // Just look for numbers that might be amounts
      /(?:amount|total|sum|payment|transfer|paid|received|deposited|withdrawal|charge):?\s*(\d+(?:[.,]\d+)?)/i
    ];
    
    for (const pattern of amountPatterns) {
      const match = message.match(pattern);
      if (match) {
        // If first pattern matched, the amount is in group 2
        // If second pattern matched, the amount is in group 1
        const amountStr = pattern === amountPatterns[0] ? match[2] : match[1];
        amount = parseFloat(amountStr.replace(',', '.'));
        
        // If we matched currency in the pattern, ensure it's set
        if (!currency && match[2] && pattern === amountPatterns[1]) {
          currency = this.normalizeCurrency(match[2]);
        } else if (!currency && match[1] && pattern === amountPatterns[0]) {
          currency = this.normalizeCurrency(match[1]);
        }
        
        break;
      }
    }
    
    // Determine transaction type
    let type: 'income' | 'expense' | undefined;
    
    if (messageLower.includes('withdraw') || 
        messageLower.includes('debited') || 
        messageLower.includes('purchase') || 
        messageLower.includes('payment') || 
        messageLower.includes('spent') || 
        messageLower.includes('paid') || 
        messageLower.includes('بخصم') ||
        messageLower.includes('سحب') ||
        messageLower.includes('خصم')) {
      type = 'expense';
      // Make sure amount is negative for expenses
      amount = -Math.abs(amount);
    } else if (messageLower.includes('deposit') || 
               messageLower.includes('credited') || 
               messageLower.includes('received') || 
               messageLower.includes('refund') || 
               messageLower.includes('salary') || 
               messageLower.includes('income') ||
               messageLower.includes('إيداع') ||
               messageLower.includes('إضافة') ||
               messageLower.includes('تم إضافة')) {
      type = 'income';
      // Make sure amount is positive for income
      amount = Math.abs(amount);
    }
    
    // Try to extract title
    let title: string | undefined;
    
    // Look for merchant or transaction description
    const merchantPatterns = [
      /(?:at|to|from)\s+([A-Za-z0-9\s&'.]+?)(?:\s+on|\s+for|\s+\d|\s*$)/i,
      /(?:purchase|payment|transaction)\s+(?:at|to|from)\s+([A-Za-z0-9\s&'.]+)/i,
      /(?:merchant|payee|recipient):\s*([A-Za-z0-9\s&'.]+)/i
    ];
    
    for (const pattern of merchantPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }
    
    // If no title found, try to use sender as title if it's not a phone number
    if (!title && sender && !/^\+?\d+$/.test(sender)) {
      title = sender.replace(/^sms from |^msg from |^alert: /i, '').trim();
    }
    
    // Try to determine category
    let category: string | undefined;
    
    const categoryMapping: Record<string, string[]> = {
      'Food': ['restaurant', 'cafe', 'coffee', 'dining', 'food', 'grocery', 'supermarket', 'مطعم', 'كافيه', 'طعام', 'بقالة'],
      'Transportation': ['uber', 'taxi', 'car', 'transport', 'fuel', 'gas', 'parking', 'سيارة', 'وقود', 'بنزين', 'أوبر'],
      'Shopping': ['mall', 'shop', 'store', 'retail', 'purchase', 'amazon', 'متجر', 'تسوق'],
      'Utilities': ['electricity', 'water', 'gas', 'internet', 'phone', 'bill', 'utility', 'كهرباء', 'ماء', 'فاتورة'],
      'Entertainment': ['movie', 'cinema', 'theater', 'ticket', 'سينما', 'تذكرة', 'ترفيه'],
      'Health': ['doctor', 'hospital', 'clinic', 'pharmacy', 'medical', 'دكتور', 'مستشفى', 'صيدلية', 'طبي'],
      'Income': ['salary', 'income', 'deposit', 'credit', 'راتب', 'دخل', 'إيداع'],
      'Transfer': ['transfer', 'sent', 'remit', 'تحويل', 'ارسال']
    };
    
    for (const [cat, keywords] of Object.entries(categoryMapping)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        category = cat;
        break;
      }
    }
    
    return { amount, title, category, type, currency };
  }
  
  // Helper to extract account information
  private extractAccountInfo(message: string, sender: string): string | undefined {
    const messageLower = message.toLowerCase();
    
    // Look for account references
    const accountPatterns = [
      /(?:account|a\/c|acct)(?:.|:|\s)+([A-Za-z0-9*]+)/i,
      /(?:card)(?:.|:|\s)+([A-Za-z0-9*]+)/i,
      /(?:from|in|your)\s+([A-Za-z]+)\s+(?:account|card)/i
    ];
    
    for (const pattern of accountPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const accountInfo = match[1].trim();
        
        // If the account is just numbers/asterisks, combine with sender name
        if (/^[0-9*]+$/.test(accountInfo)) {
          const cleanSender = sender.replace(/^sms from |^msg from |^alert: /i, '').trim();
          return `${cleanSender} (${accountInfo})`;
        }
        
        return accountInfo;
      }
    }
    
    // Try to use sender as account if it looks like a bank or financial institution
    if (sender && !/^\+?\d+$/.test(sender)) {
      const cleanSender = sender.replace(/^sms from |^msg from |^alert: /i, '').trim();
      const financialKeywords = ['bank', 'credit', 'card', 'financial', 'finance', 'بنك', 'بطاقة', 'مالي'];
      
      if (financialKeywords.some(keyword => cleanSender.toLowerCase().includes(keyword))) {
        return cleanSender;
      }
    }
    
    return undefined;
  }
  
  // Helper to detect currency from message
  private detectCurrency(message: string): string | undefined {
    const currencyPatterns = [
      { currency: 'SAR', patterns: ['sar', 'riyal', 'ريال', 'sr', 'saudi riyal', 'ر.س'] },
      { currency: 'EGP', patterns: ['egp', 'egyptian pound', 'جنيه', 'le', 'ج.م'] },
      { currency: 'INR', patterns: ['inr', 'rupee', 'rupees', 'rs.', '₹'] },
      { currency: 'AED', patterns: ['aed', 'dirham', 'دراهم', 'د.إ'] },
      { currency: 'USD', patterns: ['usd', '$', 'dollar', 'دولار'] },
      { currency: 'EUR', patterns: ['eur', '€', 'euro', 'يورو'] }
    ];
    
    const messageLower = message.toLowerCase();
    
    for (const currency of currencyPatterns) {
      for (const pattern of currency.patterns) {
        if (messageLower.includes(pattern)) {
          return currency.currency;
        }
      }
    }
    
    return undefined;
  }
  
  // Helper to normalize currency codes
  private normalizeCurrency(currencyStr: string): string {
    const normalized = currencyStr.trim().toUpperCase();
    
    // Map symbols to standard codes
    const currencyMap: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR',
      '₹': 'INR',
      'ر.س': 'SAR',
      'ر.س.': 'SAR',
      'د.إ': 'AED',
      'د.إ.': 'AED',
      'ج.م': 'EGP',
      'ج.م.': 'EGP',
      'RS.': 'INR',
      'RS': 'INR',
      'SR': 'SAR'
    };
    
    return currencyMap[normalized] || normalized;
  }
}

export const smsProcessingService = new SmsProcessingService();
