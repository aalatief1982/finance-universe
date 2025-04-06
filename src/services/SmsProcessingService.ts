import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { parseSmsMessage } from '@/lib/sms-parser';
import { validateData, smsMessageSchema } from '@/lib/validation';
import { handleError } from '@/utils/error-utils';
import { ErrorType } from '@/types/error';
import { SupportedCurrency } from '@/types/locale';

export class SmsProcessingService {
  // Process SMS messages to extract transactions
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    const extractedTransactions: Transaction[] = [];
    const failedMessages: string[] = [];
    
    for (const message of messages) {
      try {
        // Validate SMS message format
        const validationResult = validateData(smsMessageSchema, message);
        
        // Handle validation result
        if (!validationResult.success) {
          console.warn('Invalid SMS message format:', validationResult.error);
          failedMessages.push(`${message.sender} (Invalid format)`);
          continue;
        }
        
        // At this point, TypeScript knows validationResult.data exists
        const validatedMessage = validationResult.data;
        const parsedTransaction = parseSmsMessage(validatedMessage.message, validatedMessage.sender);
        
        if (parsedTransaction) {
          const newTransaction: Transaction = {
            id: uuidv4(),
            title: parsedTransaction.description,
            amount: parsedTransaction.amount,
            category: parsedTransaction.category,
            date: parsedTransaction.date.toISOString().split('T')[0],
            type: parsedTransaction.amount >= 0 ? 'income' : 'expense',
            source: 'sms',
            smsDetails: {
              sender: message.sender,
              message: message.message,
              timestamp: message.date.toISOString()
            },
            currency: parsedTransaction.currency
          };
          
          extractedTransactions.push(newTransaction);
        } else {
          // Message couldn't be parsed into a transaction
          failedMessages.push(message.sender);
          console.debug('Could not parse SMS into transaction:', {
            sender: message.sender,
            preview: message.message.substring(0, 30) + '...'
          });
        }
      } catch (error) {
        failedMessages.push(message.sender);
        handleError({
          type: ErrorType.PARSING,
          message: 'Failed to process SMS message',
          details: { 
            sender: message.sender,
            message: message.message.substring(0, 50) + '...'
          },
          originalError: error
        }, false); // Don't show toast for each parsing error
      }
    }
    
    // Log summary
    if (messages.length > 0) {
      const successRate = (extractedTransactions.length / messages.length) * 100;
      console.log(`Processed ${messages.length} SMS messages, extracted ${extractedTransactions.length} transactions (${successRate.toFixed(1)}% success rate)`);
      
      if (failedMessages.length > 0) {
        console.warn(`Failed to process ${failedMessages.length} messages:`, 
          failedMessages.length > 5 
            ? [...failedMessages.slice(0, 5), `...and ${failedMessages.length - 5} more`] 
            : failedMessages
        );
      }
    }
    
    return extractedTransactions;
  }
  
  // Optimize SMS messages by grouping similar ones (helpful for bulk imports)
  optimizeMessagesForProcessing(messages: { sender: string; message: string; date: Date }[]): { sender: string; message: string; date: Date }[] {
    // Group messages by sender
    const messagesBySender = messages.reduce((groups, message) => {
      const sender = message.sender.toLowerCase();
      if (!groups[sender]) {
        groups[sender] = [];
      }
      groups[sender].push(message);
      return groups;
    }, {} as Record<string, typeof messages>);
    
    // For each sender, sort by date (newest first) and remove duplicates
    // This helps with bulk imports where the same transaction might be in multiple messages
    const optimizedMessages: typeof messages = [];
    
    for (const senderMessages of Object.values(messagesBySender)) {
      // Sort by date (newest first)
      senderMessages.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      // Filter out duplicate transaction notifications
      // Using a simple similarity check to detect duplicates
      const uniqueMessages = senderMessages.filter((message, index) => {
        // Skip first message (always include it)
        if (index === 0) return true;
        
        // Check if this message is similar to any previous message
        for (let i = 0; i < index; i++) {
          if (this.areMessagesSimilar(message.message, senderMessages[i].message)) {
            return false; // Skip this message as it's similar to a previous one
          }
        }
        
        return true; // Include this message
      });
      
      optimizedMessages.push(...uniqueMessages);
    }
    
    return optimizedMessages;
  }
  
  // Check if two messages are similar (likely referring to the same transaction)
  private areMessagesSimilar(message1: string, message2: string): boolean {
    // Extract numeric values (likely amounts)
    const amounts1 = this.extractAmounts(message1);
    const amounts2 = this.extractAmounts(message2);
    
    // If both messages contain the same amount, they might be duplicates
    if (amounts1.length > 0 && amounts2.length > 0) {
      for (const amount1 of amounts1) {
        if (amounts2.includes(amount1)) {
          // Same amount found, now check for text similarity
          const words1 = new Set(message1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
          const words2 = new Set(message2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
          
          // Count common significant words
          let commonWords = 0;
          for (const word of words1) {
            if (words2.has(word)) commonWords++;
          }
          
          // If more than 40% of words match, consider messages similar
          const similarityThreshold = 0.4;
          const similarity = commonWords / Math.min(words1.size, words2.size);
          
          if (similarity >= similarityThreshold) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // Extract potential amount values from a message
  private extractAmounts(message: string): string[] {
    // Match patterns like $123.45, 123.45 USD, SAR 123.45, etc.
    const amountRegex = /(?:^|\s|[^\d])([0-9,.]+\.\d{2})(?:\s|$|[^\d])/g;
    const matches = [...message.matchAll(amountRegex)];
    
    return matches.map(match => match[1].replace(/,/g, ''));
  }
  
  // Group transactions by date
  groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((groups, transaction) => {
      const date = transaction.date.substring(0, 10); // Get YYYY-MM-DD part
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }
  
  // Get frequency distribution of transaction categories
  getCategoryDistribution(transactions: Transaction[]): Record<string, number> {
    return transactions.reduce((distribution, transaction) => {
      const category = transaction.category || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
      return distribution;
    }, {} as Record<string, number>);
  }
}

// Export a singleton instance
export const smsProcessingService = new SmsProcessingService();
