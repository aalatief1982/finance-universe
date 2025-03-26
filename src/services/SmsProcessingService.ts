
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { parseSmsMessage } from '@/lib/sms-parser';

export class SmsProcessingService {
  // Process SMS messages to extract transactions
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    const extractedTransactions: Transaction[] = [];
    
    for (const message of messages) {
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
    }
    
    return extractedTransactions;
  }
}

// Export a singleton instance
export const smsProcessingService = new SmsProcessingService();
