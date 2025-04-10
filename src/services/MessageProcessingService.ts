
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';

class MessageProcessingService {
  private providersKey = 'message_providers_selected';

  // Check if user has selected message providers
  hasProvidersSelected(): boolean {
    if (typeof window === 'undefined') return false;
    
    const providers = localStorage.getItem(this.providersKey);
    // If providers exist and is not an empty array
    return !!providers && providers !== '[]';
  }

  // Save selected providers status
  saveProvidersStatus(providers: string[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.providersKey, JSON.stringify(providers));
    }
  }

  // Get selected providers
  getSelectedProviders(): string[] {
    try {
      const providers = localStorage.getItem(this.providersKey);
      return providers ? JSON.parse(providers) : [];
    } catch (error) {
      console.error('Error getting selected providers:', error);
      return [];
    }
  }

  // Process message text to extract transaction details
  processMessageText(text: string, source: string = 'paste'): Transaction | null {
    try {
      // Extract transaction details
      const { amount, title, category, currency, date } = this.extractTransactionDetails(text);
      
      if (!amount) {
        return null;
      }
      
      // Determine transaction type based on amount
      const type = amount >= 0 ? 'income' : 'expense';
      
      // Create a transaction object
      const transaction: Transaction = {
        id: uuidv4(),
        title: title || 'Transaction',
        amount: amount,
        category: category || 'Uncategorized',
        date: date ? date : new Date().toISOString().split('T')[0],
        type: type,
        source: source,
        details: {
          rawMessage: text,
          source: source
        },
        currency: currency || 'SAR', // Default currency
        fromAccount: source === 'telegram' ? 'Telegram Bot' : 'Smart Paste',
      };
      
      return transaction;
    } catch (error) {
      console.error('Error processing message:', error);
      return null;
    }
  }
  
  // Process multiple messages and return extracted transactions
  processMessagesInBatch(messages: string[], source: string = 'paste'): Transaction[] {
    const transactions: Transaction[] = [];
    
    for (const message of messages) {
      const transaction = this.processMessageText(message, source);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }
  
  // Helper method to extract transaction details from message text
  private extractTransactionDetails(message: string): { 
    amount: number; 
    title?: string; 
    category?: string;
    currency?: string;
    date?: string;
  } {
    // Simple pattern matching to extract amount
    const amountMatch = message.match(/(\$|SAR|AED|USD|EUR|EGP)\s?(\d+(\.\d+)?)|(\d+(\.\d+)?)\s?(\$|SAR|AED|USD|EUR|EGP)/i);
    let amount = 0;
    let currency: string | undefined;
    
    if (amountMatch) {
      // Extract the currency and amount
      if (amountMatch[2]) {
        amount = parseFloat(amountMatch[2]);
        currency = amountMatch[1];
      } else if (amountMatch[4]) {
        amount = parseFloat(amountMatch[4]);
        currency = amountMatch[6];
      }
      
      // Assume it's an expense by default
      amount = -amount;
    }
    
    // Extract date if available
    const dateMatch = message.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
    let date: string | undefined;
    
    if (dateMatch) {
      // Extract day, month, year and format as YYYY-MM-DD
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      // If year is 2 digits, assume 20XX
      const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
      date = `${year}-${month}-${day}`;
    }
    
    // Try to extract title
    let title: string | undefined;
    
    if (message.includes('purchase') || message.includes('payment')) {
      const atIndex = message.indexOf(' at ');
      const forIndex = message.indexOf(' for ');
      
      if (atIndex > -1) {
        title = message.substring(atIndex + 4).split(' ')[0];
      } else if (forIndex > -1) {
        title = message.substring(forIndex + 5).split(' ')[0];
      }
    }
    
    // Try to determine category
    let category: string | undefined;
    
    if (message.toLowerCase().includes('restaurant') || message.toLowerCase().includes('cafe')) {
      category = 'Food';
    } else if (message.toLowerCase().includes('uber') || message.toLowerCase().includes('taxi')) {
      category = 'Transportation';
    } else if (message.toLowerCase().includes('salary') || message.toLowerCase().includes('deposit')) {
      category = 'Income';
      amount = Math.abs(amount); // Make it positive for income
    }
    
    return { amount, title, category, currency, date };
  }
}

export const messageProcessingService = new MessageProcessingService();
