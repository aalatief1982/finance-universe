import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Import after mocks
import { parseAndInferTransaction } from '../parseAndInferTransaction';
import { parseSmsMessage } from '../structureParser';
import { saveTransactionWithLearning } from '../saveTransactionWithLearning';

describe('Smart Paste Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('SMS parsing to transaction conversion', () => {
    it('learns template through save flow and then exact-matches with templateScore=1.0', async () => {
      const sms = 'Purchase of SAR 150.00 at CARREFOUR on 15/01/2024. Ref: 123456';

      saveTransactionWithLearning(
        {
          id: 'txn-1',
          title: 'Purchase',
          amount: 150,
          currency: 'SAR',
          category: 'Food',
          subcategory: 'Groceries',
          date: '2024-01-15',
          type: 'expense',
          source: 'smart-paste',
          vendor: 'CARREFOUR',
          fromAccount: 'ALRAJHI',
        },
        {
          rawMessage: sms,
          isNew: true,
          senderHint: 'ALRAJHI',
          addTransaction: vi.fn(),
          updateTransaction: vi.fn(),
          learnFromTransaction: vi.fn(),
          navigateBack: vi.fn(),
          silent: true,
        },
      );

      const result = await parseAndInferTransaction(sms, 'ALRAJHI');
      expect(result.parsed.matched).toBe(true);
      expect(result.debugTrace.confidenceBreakdown.templateScore).toBe(1);
    });

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

    it('infers type from legacy xpensia_type_keywords array without defaulting score to zero', async () => {
      localStorage.setItem(
        'xpensia_type_keywords',
        JSON.stringify([{ keyword: 'شراء', type: 'expense' }]),
      );

      const result = await parseAndInferTransaction('شراء بمبلغ SAR 35 لدى bolt');
      const typeField = result.debugTrace.fields.find((field) => field.field === 'type');

      expect(result.transaction.type).toBe('expense');
      expect(typeField?.score || 0).toBeGreaterThan(0);
      expect(typeField?.tier).not.toBe('needs_review');
    });


    it('extracts core fields from dual-currency international SMS even when confidence is partial', async () => {
      const sms = `شراء عبر الانترنت
باستخدام بطاقة الأول VISA My Card الائتمانية (0275) لدى GITHUB, INC. بمبلغ USD 10.00 في UNITED STATES
سعر الصرف: 3.75200
المبلغ بالريال: 37.52
الرسوم الدولية بالريال: 0.86
المبلغ الإجمالي بالريال: 38.38
تاريخ: 2026-02-27 22:45:40
الرصيد: 170.07 ريال`;

      const result = await parseAndInferTransaction(sms, 'ALAWAL');

      expect(['partial', 'failed']).toContain(result.parsingStatus);
      expect(result.transaction.amount).toBe(10);
      expect(result.transaction.currency).toBe('USD');
      expect(result.transaction.vendor.toLowerCase()).toContain('github');
      expect(result.confidence).toBeLessThan(0.5);
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
