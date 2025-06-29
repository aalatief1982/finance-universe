export interface CsvConversionOptions {
  delimiter?: string;
}

import { Transaction } from '@/types/transaction';

/**
 * Convert an array of transactions to a CSV string.
 * @param transactions Array of Transaction objects
 * @param options Optional delimiter configuration
 */
export const convertTransactionsToCsv = (
  transactions: Transaction[],
  options: CsvConversionOptions = {}
): string => {
  if (!transactions || transactions.length === 0) return '';

  const delimiter = options.delimiter || ',';

  const headers = [
    'id',
    'title',
    'amount',
    'category',
    'subcategory',
    'date',
    'type',
    'notes',
    'source',
    'currency',
    'person',
    'fromAccount',
    'toAccount',
    'country',
    'description',
    'originalCurrency',
    'vendor',
    'account',
    'createdAt'
  ];

  const escape = (value: any) => {
    if (value === undefined || value === null) return '';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map(txn =>
    headers.map(h => escape((txn as any)[h])).join(delimiter)
  );

  return [headers.join(delimiter), ...rows].join('\n');
};
