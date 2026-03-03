import { describe, expect, it } from 'vitest';
import { maskCardDigits, maskPhoneNumber, maskRawSms, maskSensitiveText } from '@/utils/engineOutMasking';

describe('engineOutMasking', () => {
  it('masks phone numbers and card digits in free text', () => {
    const input = 'Call me at +966 55 123 4567 and card 4111 1111 1111 1111';
    const masked = maskSensitiveText(input);

    expect(masked).toContain('***-***-4567');
    expect(masked).toContain('**** **** **** 1111');
  });

  it('masks raw sms with preview and hash', () => {
    const sms = 'Purchase at Example Store amount 123.45 SAR ending card 1234';
    const masked = maskRawSms(sms);
    expect(masked.startsWith('Purchase at Example S')).toBe(true);
    expect(masked).toContain('[hash:');
  });

  it('handles explicit helper masking', () => {
    expect(maskPhoneNumber('+966501234567')).toBe('***-***-4567');
    expect(maskCardDigits('5555444433332222')).toBe('**** **** **** 2222');
  });
});
