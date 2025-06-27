import { parseSmsMessage } from '../smsParser';

describe('parseSmsMessage', () => {
  it('extracts basic fields from a simple message', () => {
    const message = 'Spent 50 SAR at Starbucks, on 2024-05-01';
    const result = parseSmsMessage(message);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.amount).toBe(50);
    expect(result.currency).toBe('SAR');
    expect(result.vendor).toBe('Starbucks');
    expect(result.date).toBe('2024-05-01T00:00:00.000Z');
    expect(result.type).toBe('expense');
    expect(result.category).toBe('Other');
    expect(result.subcategory).toBe('Miscellaneous');
    expect(result.description).toBe(message);
  });
});
