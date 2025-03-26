
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { parseSmsMessage } from '@/lib/sms-parser';
import { validateData, smsMessageSchema } from '@/lib/validation';
import { handleError } from '@/utils/error-utils';
import { ErrorType } from '@/types/error';

export class SmsProcessingService {
  // Process SMS messages to extract transactions
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    const extractedTransactions: Transaction[] = [];
    
    for (const message of messages) {
      try {
        // Validate SMS message format
        const validationResult = validateData(smsMessageSchema, message);
        if (!validationResult.success) {
          // Now we check for success before accessing error
          console.warn('Invalid SMS message format:', validationResult.error);
          continue;
        }
        
        const parsedTransaction = parseSmsMessage(message.message, message.sender);
        
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
            }
          };
          
          extractedTransactions.push(newTransaction);
        }
      } catch (error) {
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
    }
    
    return extractedTransactions;
  }
}

// Export a singleton instance
export const smsProcessingService = new SmsProcessingService();
