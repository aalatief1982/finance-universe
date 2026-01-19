import { describe, expect, it, vi } from 'vitest';
import { processSmsEntries } from '../SmsProcessingService';

vi.mock('@/lib/smart-paste-engine/structureParser', () => ({
  parseSmsMessage: vi.fn(() => ({
    directFields: {
      amount: { value: '200' },
      currency: { value: 'جنيه' },
      vendor: { value: 'Cafe' },
      date: { value: '2024-01-02' },
    },
    inferredFields: {
      category: { value: 'Food' },
      subcategory: { value: 'Coffee' },
      type: { value: 'expense' },
      fromAccount: { value: 'Cash' },
    },
  })),
}));

describe('SmsProcessingService', () => {
  it('processes SMS entries into transactions', () => {
    const entry = {
      sender: 'Bank',
      message: 'Paid 200 جنيه at Cafe',
      timestamp: '2024-01-02T10:00:00Z',
    };

    const results = processSmsEntries([entry]);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Cafe');
    expect(results[0].amount).toBe(200);
    expect(results[0].currency).toBe('EGP');
    expect(results[0].details.sms.sender).toBe('Bank');
    expect(results[0].id.startsWith('sms-')).toBe(true);
  });
});
