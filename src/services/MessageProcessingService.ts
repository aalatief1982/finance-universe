
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType } from '@/types/transaction';

class MessageProcessingService {
  processMessageText(text: string): Transaction | null {
    try {
      // Simple pattern matching to extract amount
      const amountMatch = text.match(/(\$|SAR|AED|USD|EUR|EGP)\s?(\d+(\.\d+)?)|(\d+(\.\d+)?)\s?(\$|SAR|AED|USD|EUR|EGP)/i);
      
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
      if (text.toLowerCase().includes('deposit') || 
          text.toLowerCase().includes('credit') ||
          text.toLowerCase().includes('salary') ||
          text.toLowerCase().includes('received')) {
        amount = Math.abs(amount); // Make it positive for income
      }
      
      // Use current date
      const transactionDate = new Date().toISOString().split('T')[0];
      
      const txType: TransactionType = amount >= 0 ? 'income' : 'expense';
      
      // Create transaction
      const transaction: Transaction = {
        id: uuidv4(),
        title: this.extractTitle(text) || 'Transaction',
        amount: amount,
        category: this.suggestCategory(text, amount),
        date: transactionDate,
        type: txType,
        source: 'import',
        details: {
          rawMessage: text,
        },
        currency: currency || 'SAR',
        fromAccount: this.extractBank(text),
      };
      
      return transaction;
    } catch (error) {
      console.error('Error processing message text:', error);
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
      return 'Utilities';
    } else if (text.includes('transfer')) {
      return 'Transfer';
    } else if (text.includes('shopping') || text.includes('purchase') || text.includes('amazon')) {
      return 'Shopping';
    } else if (text.includes('health') || text.includes('doctor') || text.includes('pharmacy')) {
      return 'Health';
    }
    
    return 'Uncategorized';
  }
  
  private extractBank(text: string): string {
    // Simplistic bank name extraction from message text
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
      if (text.toUpperCase().includes(code.toUpperCase())) {
        return name;
      }
    }
    
    return 'Unknown Bank';
  }
}

export const messageProcessingService = new MessageProcessingService();
