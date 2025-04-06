
// Adding a simple fix for the SmsProcessingService
// Note: We're assuming this file exists - if not, this would need to be created

import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';

class SmsProcessingService {
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    // Process the SMS messages to extract transaction data
    // This is a simplified implementation - real implementation would be more complex
    
    return messages.map(msg => {
      // Extract transaction details from SMS
      const { amount, title, category } = this.extractTransactionDetails(msg.message);
      
      // Determine transaction type based on amount
      const type = amount >= 0 ? 'income' : 'expense';
      
      // Create a transaction object
      const transaction: Transaction = {
        id: uuidv4(),
        title: title || msg.sender,
        amount: amount,
        category: category || 'Uncategorized',
        date: msg.date.toISOString().split('T')[0],
        type: type,
        source: 'sms',
        smsDetails: {
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.date.toISOString()
        },
        currency: 'SAR', // Default currency
        fromAccount: 'Bank Account', // Add default fromAccount
      };
      
      return transaction;
    });
  }
  
  // Helper method to extract transaction details from SMS
  private extractTransactionDetails(message: string): { amount: number; title?: string; category?: string } {
    // Simple pattern matching to extract amount
    const amountMatch = message.match(/(\$|SAR|AED|USD)\s?(\d+(\.\d+)?)/i);
    let amount = 0;
    
    if (amountMatch) {
      amount = parseFloat(amountMatch[2]);
      
      // Assume it's an expense by default
      amount = -amount;
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
    
    return { amount, title, category };
  }
}

export const smsProcessingService = new SmsProcessingService();
