
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';

class SmsProcessingService {
  // Process SMS messages to extract transaction information
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    const transactions: Transaction[] = [];
    
    for (const message of messages) {
      const transaction = this.extractTransactionFromSMS(message);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }
  
  private extractTransactionFromSMS(message: { sender: string; message: string; date: Date }): Transaction | null {
    try {
      // Simple pattern matching to extract amount
      const amountMatch = message.message.match(/(\$|SAR|AED|USD|EUR|EGP)\s?(\d+(\.\d+)?)|(\d+(\.\d+)?)\s?(\$|SAR|AED|USD|EUR|EGP)/i);
      
      if (!amountMatch) return null;
      
      // Extract amount and currency
      let amount = 0;
      let currency: string | undefined;
      
      if (amountMatch[2]) {
        amount = parseFloat(amountMatch[2]);
        currency = amountMatch[1];
      } else if (amountMatch[4]) {
        amount = parseFloat(amountMatch[4]);
        currency = amountMatch[6];
      }
      
      // Default to expense (negative amount)
      if (amount > 0) {
        amount = -amount;
      }
      
      // Check for deposit/income keywords
      if (message.message.toLowerCase().includes('deposit') || 
          message.message.toLowerCase().includes('credit') ||
          message.message.toLowerCase().includes('salary')) {
        amount = Math.abs(amount); // Make it positive for income
      }
      
      // Use the message date or fallback to current date
      const transactionDate = message.date.toISOString().split('T')[0];
      
      // Create a transaction
      const transaction: Transaction = {
        id: uuidv4(),
        title: this.extractTitle(message.message) || message.sender,
        amount: amount,
        category: this.suggestCategory(message.message, amount),
        date: transactionDate,
        type: amount >= 0 ? 'income' : 'expense',
        source: 'import', // Using 'import' as source type
        details: {
          rawMessage: message.message,
          sender: message.sender,
          timestamp: message.date.toISOString()
        },
        currency: currency || 'SAR',
        fromAccount: this.extractBank(message.sender),
      };
      
      return transaction;
    } catch (error) {
      console.error('Error extracting transaction from SMS:', error);
      return null;
    }
  }
  
  private extractTitle(messageText: string): string | null {
    // Extract merchant name or transaction description
    const patterns = [
      /at\s+([A-Za-z0-9\s&]+)/i,
      /to\s+([A-Za-z0-9\s&]+)/i,
      /from\s+([A-Za-z0-9\s&]+)/i,
      /purchase\s+at\s+([A-Za-z0-9\s&]+)/i,
      /payment\s+to\s+([A-Za-z0-9\s&]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = messageText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  private suggestCategory(messageText: string, amount: number): string {
    const text = messageText.toLowerCase();
    
    // Basic category rules based on keywords
    if (text.includes('restaurant') || text.includes('café') || text.includes('cafe') || text.includes('food')) {
      return 'Food';
    } else if (text.includes('transport') || text.includes('uber') || text.includes('taxi') || text.includes('train')) {
      return 'Transportation';
    } else if (text.includes('salary') || text.includes('deposit') || amount > 0) {
      return 'Income';
    } else if (text.includes('bill') || text.includes('utility')) {
      return 'Bills';
    } else if (text.includes('transfer')) {
      return 'Transfer';
    } else if (text.includes('shopping') || text.includes('purchase') || text.includes('amazon')) {
      return 'Shopping';
    } else if (text.includes('health') || text.includes('doctor') || text.includes('pharmacy')) {
      return 'Health';
    }
    
    return 'Uncategorized';
  }
  
  private extractBank(sender: string): string {
    // Simplistic bank name extraction from SMS sender
    const knownBanks = {
      'SABB': 'SABB Bank',
      'AlAhli': 'Al Ahli Bank',
      'RiyadBank': 'Riyad Bank',
      'AlRajhi': 'Al Rajhi Bank',
      'BankAlbilad': 'Bank Albilad',
      'CITI': 'Citibank',
      'HSBC': 'HSBC Bank',
      'Emirates': 'Emirates NBD',
      'ADCB': 'Abu Dhabi Commercial Bank',
      'DIB': 'Dubai Islamic Bank',
      'QNB': 'Qatar National Bank',
      'QIB': 'Qatar Islamic Bank',
      'KFH': 'Kuwait Finance House',
      'NBK': 'National Bank of Kuwait',
      'BAJ': 'Bank AlJazira',
      'BSF': 'Banque Saudi Fransi',
      'SNB': 'Saudi National Bank'
    };
    
    for (const [code, name] of Object.entries(knownBanks)) {
      if (sender.toUpperCase().includes(code.toUpperCase())) {
        return name;
      }
    }
    
    return 'Unknown Bank';
  }
}

export const smsProcessingService = new SmsProcessingService();
