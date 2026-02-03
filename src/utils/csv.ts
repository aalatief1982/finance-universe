/**
 * @file csv.ts
 * @description CSV import/export helpers for transactions.
 *
 * @module utils/csv
 *
 * @responsibilities
 * 1. Convert transactions to CSV with escaped fields
 * 2. Parse CSV rows into Transaction objects
 * 3. Include FX fields for multi-currency support
 *
 * @dependencies
 * - uuid: ID generation for imported rows
 *
 * @review-tags
 * - @risk: CSV parsing edge cases with quotes/newlines
 *
 * @review-checklist
 * - [ ] Required fields validated on import
 * - [ ] CSV escaping handles quotes and newlines
 * - [ ] FX fields exported for audit trail
 */

export interface CsvConversionOptions {
  delimiter?: string;
  /** Include FX columns in export (default: true) */
  includeFxFields?: boolean;
}

import { Transaction, TransactionType, TransactionSource, FxSource } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

/**
 * Convert an array of transactions to a CSV string.
 * Includes FX fields for multi-currency audit trail.
 * 
 * @param transactions Array of Transaction objects
 * @param options Optional delimiter and FX field configuration
 */
export const convertTransactionsToCsv = (
  transactions: Transaction[],
  options: CsvConversionOptions = {}
): string => {
  if (!transactions || transactions.length === 0) return '';

  const delimiter = options.delimiter || ',';
  const includeFxFields = options.includeFxFields !== false;

  // Base headers
  const baseHeaders = [
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

  // FX-specific headers for multi-currency audit trail
  const fxHeaders = [
    'baseCurrency',
    'amountInBase',
    'fxRateToBase',
    'fxSource',
    'fxLockedAt',
    'fxPair'
  ];

  const headers = includeFxFields ? [...baseHeaders, ...fxHeaders] : baseHeaders;

  const escape = (value: any) => {
    if (value === undefined || value === null) return '';
    const str = String(value)
      .replace(/"/g, '""')
      .replace(/\r?\n/g, '\\n');
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
 * Supports FX fields for multi-currency import.
 * 
 * Required fields: title, amount, date, type, category
 */
export const parseCsvTransactions = (fileData: string): Transaction[] => {
  if (!fileData) return [];

  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < fileData.length; i++) {
    const ch = fileData[i];
    if (ch === '"') {
      if (inQuotes && fileData[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim().length > 0) rows.push(current);
      current = '';
      if (ch === '\r' && fileData[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) rows.push(current);

  if (rows.length < 2) return [];

  const splitRow = (row: string) => {
    const values: string[] = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (quoted && row[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === ',' && !quoted) {
        values.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    values.push(field);
    return values.map(v =>
      v
        .replace(/^"|"$/g, '')
        .replace(/""/g, '"')
        .replace(/\\n/g, '\n')
        .trim()
    );
  };

  const headers = splitRow(rows[0]);
  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = splitRow(rows[i]);
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
      currency: row.currency || 'USD',
    };

    // Optional base fields
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

    // FX fields for multi-currency support
    if (row.baseCurrency) txn.baseCurrency = row.baseCurrency;
    if (row.amountInBase) txn.amountInBase = parseFloat(row.amountInBase);
    if (row.fxRateToBase) txn.fxRateToBase = parseFloat(row.fxRateToBase);
    if (row.fxSource) txn.fxSource = row.fxSource as FxSource;
    if (row.fxLockedAt) txn.fxLockedAt = row.fxLockedAt;
    if (row.fxPair) txn.fxPair = row.fxPair;

    transactions.push(txn);
  }

  return transactions;
};
