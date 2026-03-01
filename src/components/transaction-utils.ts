import type { Transaction } from '@/types/transaction';

const isValidDate = (value?: string): boolean => {
  if (!value) return false;
  const normalized = value.includes('T') ? value.split('T')[0] : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return false;
  }

  const parsed = new Date(`${normalized}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
};

const isValidCategorySelection = (category?: string, subcategory?: string): boolean => {
  const normalizedCategory = (category || '').trim().toLowerCase();
  const normalizedSubcategory = (subcategory || '').trim().toLowerCase();

  if (!normalizedCategory || normalizedCategory === 'uncategorized') {
    return false;
  }

  if (!normalizedSubcategory || normalizedSubcategory === 'none') {
    return false;
  }

  return true;
};

export function generateDefaultTitle(txn: Transaction): string {
  if (!isValidCategorySelection(txn.category, txn.subcategory) || !isValidDate(txn.date)) {
    return '';
  }

  const amountValue = Number.parseFloat(String(txn.amount));
  if (!Number.isFinite(amountValue) || amountValue === 0) {
    return '';
  }

  const label = txn.vendor?.trim() || txn.subcategory?.trim() || txn.category?.trim() || '';
  const amount = Math.abs(amountValue).toFixed(2);
  const currency = txn.currency?.toUpperCase().trim() || '';

  if (!label || !currency) {
    return '';
  }

  return `${label} - ${amount} ${currency}`;
}
