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
        title: directFields.vendor?.value || inferredFields.vendor?.value || 'SMS Transaction',
        amount: parseFloat(directFields.amount?.value || inferredFields.amount?.value || '0'),
        category: inferredFields.category?.value || 'Uncategorized',
        subcategory: inferredFields.subcategory?.value || 'none',
        date: directFields.date?.value || new Date().toISOString().split('T')[0],
        type: (directFields.type?.value || inferredFields.type?.value || (parseFloat(directFields.amount?.value || '0') > 0 ? 'income' : 'expense')) as 'income' | 'expense',
        notes: '',
        source: 'sms-import',
        currency: directFields.currency?.value || inferredFields.currency?.value || 'USD',
        fromAccount: inferredFields.fromAccount?.value || 'Cash',
        details: {
          ...Object.fromEntries(
            Object.entries(directFields).map(([k, v]) => [k, v.value])
          ),
          ...Object.fromEntries(
            Object.entries(inferredFields).map(([k, v]) => [k, v.value])
          ),
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
