import type { Transaction } from '@/types/transaction';

export function generateDefaultTitle(txn: Transaction): string {
  const label = txn.vendor?.trim() || (txn.subcategory && txn.subcategory !== 'none' ? txn.subcategory : '');
  const amount = txn.amount ? parseFloat(txn.amount.toString()).toFixed(2) : '';
  const currency = txn.currency?.toUpperCase() || '';

  return label && amount && currency ? `${label} - ${amount} ${currency}` : '';
}
