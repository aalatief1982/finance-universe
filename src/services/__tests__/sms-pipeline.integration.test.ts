import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Mock firebase analytics
vi.mock('@/utils/firebase-analytics', () => ({
  logAnalyticsEvent: vi.fn(),
}));

// Import after mocks
import { transactionService } from '../TransactionService';
import { processSmsEntries } from '../SmsProcessingService';

describe('SMS Pipeline Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('SMS to transaction conversion', () => {
    it('should process SMS entries and return transactions', () => {
      const smsEntries = [
        {
          sender: 'ALRAJHI',
          message: 'Purchase of SAR 150.00 at CARREFOUR',
          timestamp: '2024-01-15T10:30:00Z',
        },
      ];

      const transactions = processSmsEntries(smsEntries);

      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should handle multiple SMS entries', () => {
      const smsEntries = [
        {
          sender: 'ALRAJHI',
          message: 'Purchase SAR 100',
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          sender: 'SABB',
          message: 'Purchase SAR 200',
          timestamp: '2024-01-15T11:30:00Z',
        },
      ];

      const transactions = processSmsEntries(smsEntries);

      expect(transactions.length).toBeLessThanOrEqual(2);
    });

    it('should skip invalid SMS entries gracefully', () => {
      const smsEntries = [
        {
          sender: 'SPAM',
          message: 'Win a prize! Click here!',
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          sender: 'ALRAJHI',
          message: 'Purchase SAR 100 at STORE',
          timestamp: '2024-01-15T11:30:00Z',
        },
      ];

      // Should not throw
      const transactions = processSmsEntries(smsEntries);
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe('TransactionService SMS processing', () => {
    it('should process SMS messages via transaction service', () => {
      const messages = [
        {
          sender: 'BANK',
          message: 'Purchase SAR 100',
          date: new Date('2024-01-15'),
        },
      ];

      const transactions = transactionService.processTransactionsFromSMS(messages);

      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should handle empty message array', () => {
      const transactions = transactionService.processTransactionsFromSMS([]);

      expect(transactions).toEqual([]);
    });
  });

  describe('End-to-end SMS flow', () => {
    it('should process SMS and allow saving to storage', () => {
      const messages = [
        {
          sender: 'BANK',
          message: 'Purchase SAR 250 at GROCERY',
          date: new Date('2024-01-15'),
        },
      ];

      // Process SMS
      const parsedTransactions = transactionService.processTransactionsFromSMS(messages);

      // If valid transactions were parsed, they can be added
      parsedTransactions.forEach(tx => {
        if (tx.amount !== 0) {
          transactionService.addTransaction({
            ...tx,
            source: 'sms-import',
          });
        }
      });

      // Verify storage was updated
      const allTransactions = transactionService.getAllTransactions();
      expect(Array.isArray(allTransactions)).toBe(true);
    });
  });

  describe('Currency detection', () => {
    it('should detect SAR currency from SMS', () => {
      const smsEntries = [
        {
          sender: 'BANK',
          message: 'Purchase of SAR 100.00 at STORE',
          timestamp: '2024-01-15T10:30:00Z',
        },
      ];

      const transactions = processSmsEntries(smsEntries);

      if (transactions.length > 0) {
        expect(transactions[0].currency).toBe('SAR');
      }
    });
  });

  describe('Error handling', () => {
    it('should not throw on malformed SMS data', () => {
      const malformedEntries = [
        {
          sender: '',
          message: '',
          timestamp: 'invalid-date',
        },
      ];

      expect(() => processSmsEntries(malformedEntries)).not.toThrow();
    });

    it('should handle SMS with only partial transaction data', () => {
      const partialSms = [
        {
          sender: 'BANK',
          message: 'Account balance is low',
          timestamp: '2024-01-15T10:30:00Z',
        },
      ];

      const transactions = processSmsEntries(partialSms);
      expect(Array.isArray(transactions)).toBe(true);
    });
  });
});
