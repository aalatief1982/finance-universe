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

  it('resolves ambiguous 26/3/12 to 2026-03-12 using anchor date', () => {
    const anchor = new Date('2026-03-12').getTime();
    expect(normalizeDate('26/3/12', anchor)).toBe('2026-03-12');
  });

  it('resolves 12/3/26 to 2026-03-12 using anchor date', () => {
    const anchor = new Date('2026-03-12').getTime();
    expect(normalizeDate('12/3/26', anchor)).toBe('2026-03-12');
  });
});
