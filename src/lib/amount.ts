export const parseAmount = (input: string | number): number => {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : Number.NaN;
  }

  const normalized = String(input ?? '')
    .trim()
    .replace(/,/g, '')
    .replace(/\s+/g, '');

  if (!normalized) {
    return Number.NaN;
  }

  const sanitized = normalized.replace(/[^0-9.-]/g, '');
  if (!sanitized || sanitized === '-' || sanitized === '.' || sanitized === '-.') {
    return Number.NaN;
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};
