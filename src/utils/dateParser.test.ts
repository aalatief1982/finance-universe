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
});
