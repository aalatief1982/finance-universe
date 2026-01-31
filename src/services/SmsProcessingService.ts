/**
 * @file SmsProcessingService.ts
 * @description Transforms inbound SMS entries into transaction records using
 *              the smart-paste parsing pipeline.
 *
 * @responsibilities
 * - Parse SMS message body into structured fields
 * - Normalize currency codes for localized inputs
 * - Assemble Transaction objects with SMS metadata
 *
 * @dependencies
 * - structureParser.ts: Extracts fields and inferred data
 * - currency-utils.ts: Normalizes currency codes
 *
 * @review-tags
 * - @error-handling: parsing failures are logged and filtered out
 * - @risk: parsed amounts and inferred categories must be validated upstream
 *
 * @review-checklist
 * - [ ] Confirm SMS parsing failures never emit partial transactions
 * - [ ] Verify currency normalization handles localized inputs
 */
import { parseSmsMessage } from '@/lib/smart-paste-engine/structureParser';
import { Transaction } from '@/types/transaction';
import { normalizeCurrencyCode } from '@/utils/currency-utils';

interface SmsEntry {
  sender: string;
  message: string;
  timestamp: string;
}

/**
 * Processes SMS entries to extract transaction details.
 * @param entries An array of SMS entries to process.
 * @returns An array of transactions extracted from the SMS entries.
 *
 * @review-focus
 * - Ensure parsing failures do not emit malformed transactions
 * - Verify currency normalization covers localized inputs
 */
export function processSmsEntries(entries: SmsEntry[]): Transaction[] {
  // ============================================================================
  // SECTION: Parsing + Normalization Pipeline
  // PURPOSE: Convert SMS text into structured Transaction records
  // REVIEW: Handle parsing failures and ensure required defaults are applied
  // ============================================================================
  return entries.map(entry => {
    try {
      // Use the smart paste engine to parse the SMS message
      const parsedResult = parseSmsMessage(entry.message, entry.sender);

      // Extract relevant information from the parsed result
      const { directFields, inferredFields } = parsedResult;

      // Normalize currency code to handle Arabic names like 'جنيه' -> 'EGP'
      const rawCurrency = directFields.currency?.value || inferredFields.currency?.value || 'USD';
      const normalizedCurrency = normalizeCurrencyCode(rawCurrency);

      // Combine direct and inferred fields to create a transaction object
      // REVIEW-ANCHOR: sms-transaction-shape
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
        currency: normalizedCurrency,
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
      // REVIEW-ANCHOR: sms-parse-failure
      if (import.meta.env.MODE === 'development') {
        console.error('Error processing SMS entry:', entry, error);
      }
      return null; // Or handle the error as needed
    }
  }).filter(transaction => transaction !== null) as Transaction[];
}
