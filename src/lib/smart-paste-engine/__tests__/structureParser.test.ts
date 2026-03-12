import { describe, expect, it, beforeEach } from 'vitest';
import { normalizeDate, parseSmsMessage } from '../structureParser';

const sampleSender = 'Bank';

describe('parseSmsMessage', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (globalThis as { __SMART_PASTE_SMS_RECEIVED_AT__?: string }).__SMART_PASTE_SMS_RECEIVED_AT__;
    delete (globalThis as { __SMART_PASTE_TX_CREATED_AT__?: string }).__SMART_PASTE_TX_CREATED_AT__;
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



  it('resolves ambiguous short numeric dates using injected SMS received anchor', () => {
    (globalThis as { __SMART_PASTE_SMS_RECEIVED_AT__?: string }).__SMART_PASTE_SMS_RECEIVED_AT__ = '2026-03-12T10:00:00.000Z';
    expect(normalizeDate('11/3/26 2:05')).toBe('2026-03-11');
    delete (globalThis as { __SMART_PASTE_SMS_RECEIVED_AT__?: string }).__SMART_PASTE_SMS_RECEIVED_AT__;
  });

  it('falls back to yy/M/d when the short triple is non-ambiguous', () => {
    expect(normalizeDate('26/3/25')).toBe('2026-03-25');
  });

  it('drops invalid calendar candidates before selecting', () => {
    (globalThis as { __SMART_PASTE_SMS_RECEIVED_AT__?: string }).__SMART_PASTE_SMS_RECEIVED_AT__ = '2025-02-15T10:00:00.000Z';
    expect(normalizeDate('2/30/25')).toBeUndefined();
    delete (globalThis as { __SMART_PASTE_SMS_RECEIVED_AT__?: string }).__SMART_PASTE_SMS_RECEIVED_AT__;
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
