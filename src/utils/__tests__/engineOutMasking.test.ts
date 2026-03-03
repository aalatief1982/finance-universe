import { describe, expect, it } from 'vitest';
import { displaySensitiveText, maskRawSms, maskSensitiveText } from '@/utils/engineOutMasking';

describe('engineOutMasking', () => {
  it('masks phone numbers and card digits in text', () => {
    const input = 'Call +966 55 123 4567 for card 4111 1111 1111 1234';
    const masked = maskSensitiveText(input);

    expect(masked).toContain('***-***-4567');
    expect(masked).toContain('**** **** **** 1234');
    expect(masked).not.toContain('4111 1111 1111');
  });


  it('keeps values masked when showRaw is disabled', () => {
    const sms = 'Card 4111 1111 1111 1234 from +966551234567';
    const displayed = displaySensitiveText(sms, false);

    expect(displayed).toContain('**** **** **** 1234');
    expect(displayed).toContain('***-***-4567');
    expect(displayed).not.toContain('4111 1111 1111 1234');
  });

  it('returns hashed preview for raw sms', () => {
    const sms = 'Your OTP is 123456. Purchase at Sample Merchant for 50 SAR';
    const masked = maskRawSms(sms);

    expect(masked).toContain('[hash:');
    expect(masked.endsWith(']')).toBe(true);
  });
});
