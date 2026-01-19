import { describe, expect, it } from 'vitest';
import { normalizeSmsDate } from './dateParser';

describe('normalizeSmsDate', () => {
  it('parses supported date formats from SMS text', () => {
    const result = normalizeSmsDate('Paid on 12-03-2024 via card.');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns undefined when no date is found', () => {
    expect(normalizeSmsDate('No date in this message.')).toBeUndefined();
  });

  it('parses YYYY/MM/DD format', () => {
    const result = normalizeSmsDate('Statement posted on 2024/03/12.');
    expect(result).toMatch(/^2024-03-12T/);
  });

  it('parses month name formats', () => {
    const result = normalizeSmsDate('Paid on 12 Mar 2024 at POS.');
    expect(result).toMatch(/^2024-03-12T/);
  });
});
