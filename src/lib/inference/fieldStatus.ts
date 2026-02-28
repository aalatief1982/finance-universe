import type { Transaction } from '@/types/transaction';

export const SMART_ENTRY_REQUIRED_FIELDS: Array<keyof Transaction> = [
  'amount',
  'date',
  'currency',
  'type',
];

interface ComputeCapturedFieldsOptions {
  fields?: Array<keyof Transaction>;
  isSuggested?: boolean;
  matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback' | 'manual' | null;
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
  const inferredByDto = Boolean(options.isSuggested || options.matchOrigin);

  const capturedFields = fields.filter((field) => {
    if (!transaction) {
      return false;
    }

    if (!hasValue(transaction[field])) {
      return false;
    }

    const score = fieldConfidences[field as string];
    return (typeof score === 'number' && score > 0) || inferredByDto;
  });

  return {
    capturedCount: capturedFields.length,
    totalCount: fields.length,
    capturedFields,
  };
}
