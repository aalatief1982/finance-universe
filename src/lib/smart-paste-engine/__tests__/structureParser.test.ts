import { describe, expect, it, beforeEach } from 'vitest';
import { parseSmsMessage } from '../structureParser';

const sampleSender = 'Bank';

describe('parseSmsMessage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes short date formats in direct fields', () => {
    const message = 'Paid SAR 120 to Cafe on 25-3-26.';
    const result = parseSmsMessage(message, sampleSender);
    expect(result.directFields.date?.value).toBe('2025-03-26');
  });

  it('handles messages without a date', () => {
    const message = 'Paid SAR 120 to Cafe.';
    const result = parseSmsMessage(message, sampleSender);
    expect(result.directFields.date).toBeUndefined();
  });

  it('throws when raw message is empty', () => {
    expect(() => parseSmsMessage('', sampleSender)).toThrow('Empty message passed to extractTemplateStructure');
  });
});
