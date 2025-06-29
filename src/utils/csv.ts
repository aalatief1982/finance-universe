export interface CsvConversionOptions {
  delimiter?: string;
}


import { Transaction, TransactionType, TransactionSource } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';


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


/**
 * Parse a CSV string into an array of Transaction objects.
 * Only rows containing the required fields are returned.
 * Required fields: title, amount, date, type, category
 */
export const parseCsvTransactions = (fileData: string): Transaction[] => {
  if (!fileData) return [];

  const lines = fileData.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const splitRow = (row: string) =>
    row
      .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map(v => v.replace(/^"|"$/g, '').trim());

  const headers = splitRow(lines[0]);
  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });

    // Validate required fields
    if (!row.title || !row.amount || !row.date || !row.type || !row.category) {
      continue;
    }

    const txn: Transaction = {
      id: row.id || uuidv4(),
      title: row.title,
      amount: parseFloat(row.amount),
      category: row.category,
      date: row.date,
      type: row.type as TransactionType,
      source: (row.source as TransactionSource) || 'import',
    };

    if (row.subcategory) txn.subcategory = row.subcategory;
    if (row.notes) txn.notes = row.notes;
    if (row.currency) txn.currency = row.currency;
    if (row.person) txn.person = row.person;
    if (row.fromAccount) txn.fromAccount = row.fromAccount;
    if (row.toAccount) txn.toAccount = row.toAccount;
    if (row.country) txn.country = row.country;
    if (row.description) txn.description = row.description;
    if (row.originalCurrency) txn.originalCurrency = row.originalCurrency;
    if (row.vendor) txn.vendor = row.vendor;
    if (row.account) txn.account = row.account;
    if (row.createdAt) txn.createdAt = row.createdAt;

    transactions.push(txn);
  }

  return transactions;
};

