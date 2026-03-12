import { describe, expect, it } from 'vitest';
import { normalizeDate } from './dateUtils';

describe('normalizeDate', () => {
  it('normalizes ISO dates to yyyy-MM-dd', () => {
    expect(normalizeDate('2024-02-05')).toBe('2024-02-05');
  });

  it('normalizes slashed dates to yyyy-MM-dd', () => {
    expect(normalizeDate('05/02/24')).toBe('2024-02-05');
  });

  it('returns null when input is not parseable', () => {
    expect(normalizeDate('not-a-date')).toBeNull();
  });
});
