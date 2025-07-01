import { parseSmsMessage } from '@/lib/smart-paste-engine/structureParser';
import { Transaction } from '@/types/transaction';

interface SmsEntry {
  sender: string;
  message: string;
  timestamp: string;
}

/**
 * Processes SMS entries to extract transaction details.
 * @param entries An array of SMS entries to process.
 * @returns An array of transactions extracted from the SMS entries.
 */
export function processSmsEntries(entries: SmsEntry[]): Transaction[] {
  return entries.map(entry => {
    try {
      // Use the smart paste engine to parse the SMS message
      const parsedResult = parseSmsMessage(entry.message, entry.sender);

      // Extract relevant information from the parsed result
      const { directFields, inferredFields } = parsedResult;

      // Combine direct and inferred fields to create a transaction object
      const transaction: Transaction = {
        id: 'sms-' + Math.random().toString(36).substring(2, 15), // Generate a random ID
        title: directFields.vendor || inferredFields.vendor || 'SMS Transaction',
        amount: parseFloat(directFields.amount || inferredFields.amount || '0'),
        category: inferredFields.category || 'Uncategorized',
        subcategory: inferredFields.subcategory || 'none',
        date: directFields.date || new Date().toISOString().split('T')[0],
        type: (directFields.type || inferredFields.type || (parseFloat(directFields.amount || '0') > 0 ? 'income' : 'expense')) as 'income' | 'expense',
        notes: '',
        source: 'sms-import',
        currency: directFields.currency || inferredFields.currency || 'USD',
        fromAccount: inferredFields.fromAccount || 'Cash',
        details: {
          ...directFields,
          ...inferredFields,
          sms: {
            sender: entry.sender,
            message: entry.message,
            timestamp: entry.timestamp
          },
          rawMessage: entry.message
        }
      };

      return transaction;
    } catch (error) {
      console.error('Error processing SMS entry:', entry, error);
      return null; // Or handle the error as needed
    }
  }).filter(transaction => transaction !== null) as Transaction[];
}
