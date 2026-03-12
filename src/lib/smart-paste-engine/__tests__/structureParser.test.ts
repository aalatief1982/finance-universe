import { describe, expect, it, beforeEach } from 'vitest';
import { parseSmsMessage } from '../structureParser';

const sampleSender = 'Bank';

describe('parseSmsMessage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes short dash date formats (DD-MM-YY)', () => {
    const message = 'Paid SAR 120 to Cafe on 25-3-26.';
    const result = parseSmsMessage(message, sampleSender);
    expect(result.directFields.date?.value).toBe('2026-03-25');
  });

  it('normalizes short slash date formats (DD/MM/YY)', () => {
    const message = 'Purchase SAR 212 at Store 11/3/26 2:05';
    const result = parseSmsMessage(message, sampleSender);
    expect(result.directFields.date?.value).toBe('2026-03-11');
  });

  it('resolves ambiguous 26/3/12 to 2026-03-12 (YY/M/DD closest to now)', () => {
    const message = 'Purchase SAR 100 at Store 26/3/12 17:36';
    const result = parseSmsMessage(message, sampleSender);
    expect(result.directFields.date?.value).toBe('2026-03-12');
  });

  it('resolves ambiguous 12/3/26 to 2026-03-12 (DD/MM/YY)', () => {
    const message = 'Purchase SAR 100 at Store 12/3/26 14:00';
    const result = parseSmsMessage(message, sampleSender);
    expect(result.directFields.date?.value).toBe('2026-03-12');
  });

  it('handles messages without a date', () => {
    const message = 'Paid SAR 120 to Cafe.';
    const result = parseSmsMessage(message, sampleSender);
    expect(result.directFields.date).toBeUndefined();
  });

  it('returns an empty parse result when raw message is empty', () => {
    const result = parseSmsMessage('', sampleSender);
    expect(result).toMatchObject({
      rawMessage: '',
      template: '',
      templateHash: '',
      matched: false,
    });
  });
});
