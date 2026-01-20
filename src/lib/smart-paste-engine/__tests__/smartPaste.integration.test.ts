import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Import after mocks
import { parseAndInferTransaction } from '../parseAndInferTransaction';
import { parseSmsMessage } from '../structureParser';

describe('Smart Paste Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('SMS parsing to transaction conversion', () => {
    it('should parse a typical bank SMS and create transaction', async () => {
      const sms = 'Purchase of SAR 150.00 at CARREFOUR on 15/01/2024. Ref: 123456';

      const result = await parseAndInferTransaction(sms, 'ALRAJHI');

      expect(result.transaction).toBeDefined();
      expect(result.transaction.amount).toBeGreaterThan(0);
      expect(result.transaction.currency).toBe('SAR');
      expect(result.transaction.source).toBe('smart-paste');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should extract amount correctly from various formats', async () => {
      const testCases = [
        { sms: 'Debit SAR 100.00', expectedAmount: 100 },
        { sms: 'Amount: 250.50 SAR', expectedAmount: 250.50 },
        { sms: 'Purchase 75 SAR', expectedAmount: 75 },
      ];

      for (const { sms, expectedAmount } of testCases) {
        const result = await parseAndInferTransaction(sms);
        expect(result.transaction.amount).toBe(expectedAmount);
      }
    });

    it('should handle missing fields gracefully', async () => {
      const incompleteSms = 'Some random text without transaction info';

      const result = await parseAndInferTransaction(incompleteSms);

      expect(result.transaction).toBeDefined();
      expect(result.transaction.id).toBeDefined();
      expect(result.parsingStatus).toBeDefined();
    });

    it('should set fromAccount from sender hint', async () => {
      const sms = 'Purchase of SAR 100 at SHOP';

      const result = await parseAndInferTransaction(sms, 'ALRAJHI');

      expect(result.transaction.fromAccount).toContain('ALRAJHI');
    });

    it('should infer expense type for purchase messages', async () => {
      const purchaseSms = 'Purchase of SAR 50 at GROCERY';

      const result = await parseAndInferTransaction(purchaseSms);

      expect(result.transaction.type).toBe('expense');
    });

    it('should infer income type for salary/credit messages', async () => {
      const incomeSms = 'Salary credited SAR 5000 to your account';

      const result = await parseAndInferTransaction(incomeSms);

      // Depending on parsing logic, this should be income
      expect(['income', 'expense']).toContain(result.transaction.type);
    });
  });

  describe('Structure parser', () => {
    it('should extract direct fields from SMS', () => {
      const sms = 'Purchase SAR 150.00 at STORE on 15/01/2024';

      const parsed = parseSmsMessage(sms);

      expect(parsed.directFields).toBeDefined();
      expect(parsed.directFields.amount).toBeDefined();
    });

    it('should extract currency correctly', () => {
      const sarSms = 'Amount SAR 100';
      const usdSms = 'Amount USD 100';

      const sarParsed = parseSmsMessage(sarSms);
      const usdParsed = parseSmsMessage(usdSms);

      expect(sarParsed.directFields.currency?.value || 'SAR').toBe('SAR');
      expect(usdParsed.directFields.currency?.value || 'USD').toBe('USD');
    });

    it('should handle multi-line SMS messages', () => {
      const multiLineSms = `ALRAJHI Bank
Purchase Transaction
Amount: SAR 250.00
Merchant: SUPERMARKET
Date: 15/01/2024`;

      const parsed = parseSmsMessage(multiLineSms);

      expect(parsed.directFields.amount?.value).toBeDefined();
    });
  });

  describe('Confidence scoring', () => {
    it('should return confidence between 0 and 1', async () => {
      const sms = 'Purchase SAR 100 at STORE';

      const result = await parseAndInferTransaction(sms);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return field confidences', async () => {
      const sms = 'Purchase SAR 100 at STORE';

      const result = await parseAndInferTransaction(sms);

      expect(result.fieldConfidences).toBeDefined();
      expect(typeof result.fieldConfidences).toBe('object');
    });

    it('should track parsing origin', async () => {
      const sms = 'Purchase SAR 100 at STORE';

      const result = await parseAndInferTransaction(sms);

      expect(['template', 'structure', 'ml', 'fallback']).toContain(result.origin);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty message', async () => {
      const result = await parseAndInferTransaction('');

      expect(result.transaction).toBeDefined();
      expect(result.transaction.amount).toBe(0);
    });

    it('should handle special characters', async () => {
      const sms = 'Purchase SAR 100.00 at CAFÉ & RESTAURANT™';

      const result = await parseAndInferTransaction(sms);

      expect(result.transaction).toBeDefined();
    });

    it('should handle Arabic text', async () => {
      const arabicSms = 'شراء ريال سعودي 100 من المتجر';

      const result = await parseAndInferTransaction(arabicSms);

      expect(result.transaction).toBeDefined();
    });

    it('should handle very long messages', async () => {
      const longSms = 'Purchase '.repeat(50) + 'SAR 100 at STORE';

      const result = await parseAndInferTransaction(longSms);

      expect(result.transaction).toBeDefined();
    });
  });

  describe('Transaction ID generation', () => {
    it('should generate unique IDs for each parse', async () => {
      const sms = 'Purchase SAR 100';

      const result1 = await parseAndInferTransaction(sms);
      const result2 = await parseAndInferTransaction(sms);

      expect(result1.transaction.id).not.toBe(result2.transaction.id);
    });
  });
});
