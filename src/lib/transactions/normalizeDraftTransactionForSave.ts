import { Transaction } from '@/types/transaction';

interface NormalizeDraftTransactionForSaveContext {
  fallbackDate?: string;
}

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDate = (value: string | undefined, fallbackDate: string): string => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return fallbackDate;
  }

  if (ISO_DATE_ONLY_REGEX.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toISOString().split('T')[0];
};

const toFiniteAmount = (value: Transaction['amount']): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Save-time normalizer for draft/edited transactions.
 *
 * Intentionally applies only persistence normalization (no inference or typing behavior).
 */
export const normalizeDraftTransactionForSave = (
  transaction: Transaction,
  context: NormalizeDraftTransactionForSaveContext = {},
): Transaction => {
  const fallbackDate = context.fallbackDate || new Date().toISOString().split('T')[0];

  const normalized: Transaction = {
    ...transaction,
    amount: toFiniteAmount(transaction.amount),
    date: normalizeDate(transaction.date, fallbackDate),
  };

  if (normalized.type === 'income') {
    if (!normalized.toAccount && normalized.fromAccount) {
      normalized.toAccount = normalized.fromAccount;
    }

    normalized.amount = Math.abs(normalized.amount);
    return normalized;
  }

  if (normalized.type === 'transfer') {
    normalized.amount = Math.abs(normalized.amount);
    return normalized;
  }

  normalized.amount = -Math.abs(normalized.amount);
  return normalized;
};

export type { NormalizeDraftTransactionForSaveContext };
