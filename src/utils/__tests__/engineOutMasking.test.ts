import { describe, expect, it } from 'vitest';
import { maskRawSms, maskSensitiveText } from '@/utils/engineOutMasking';

describe('engineOutMasking', () => {
  it('masks phone numbers and card digits in text', () => {
    const input = 'Call +966 55 123 4567 for card 4111 1111 1111 1234';
    const masked = maskSensitiveText(input);

    expect(masked).toContain('***-***-4567');
    expect(masked).toContain('**** **** **** 1234');
    expect(masked).not.toContain('4111 1111 1111');
  });

  it('returns hashed preview for raw sms', () => {
    const sms = 'Your OTP is 123456. Purchase at Sample Merchant for 50 SAR';
    const masked = maskRawSms(sms);

    expect(masked).toContain('[hash:');
    expect(masked.endsWith(']')).toBe(true);
  });
});
