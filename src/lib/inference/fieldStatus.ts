import type { Transaction } from '@/types/transaction';
import {
  resolveFieldTier,
  type ResolveFieldTierOptions,
} from '@/lib/inference/fieldTier';

export const SMART_ENTRY_REQUIRED_FIELDS: Array<keyof Transaction> = [
  'amount',
  'date',
  'vendor',
  'category',
];

interface ComputeCapturedFieldsOptions extends ResolveFieldTierOptions {
  fields?: Array<keyof Transaction>;
  isSuggested?: boolean;
}

const hasValue = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return Boolean(value);
};

export function computeCapturedFields(
  transaction: Partial<Transaction> | undefined,
  fieldConfidences: Record<string, number> = {},
  options: ComputeCapturedFieldsOptions = {},
) {
  const fields = options.fields ?? SMART_ENTRY_REQUIRED_FIELDS;

  const capturedFields = fields.filter((field) => {
    if (!transaction) {
      return false;
    }

    if (!hasValue(transaction[field])) {
      return false;
    }

    return (
      resolveFieldTier(field, {
        ...options,
        transaction,
        fieldConfidences,
      }).tier === 'high'
    );
  });

  return {
    capturedCount: capturedFields.length,
    totalCount: fields.length,
    capturedFields,
  };
}
