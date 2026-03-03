import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { buildInferenceDTO } from './buildInferenceDTO';
import { createInferenceDTOFromDetection } from './createInferenceDTOFromDetection';
import { resolveFieldTier } from './fieldTier';

const FIELDS: Array<keyof Transaction> = [
  'amount',
  'date',
  'vendor',
  'fromAccount',
  'category',
  'subcategory',
  'type',
  'currency',
];

describe('inference flow consistency', () => {
  it('produces identical field status tiers for Smart Entry and SMS review flows', async () => {
    const rawMessage = 'Purchase at BIN DAWOOD amount SAR 89.50 on 2025-02-10 card ending 1234';
    const senderHint = 'BINDAWOOD';

    const parsed = await parseAndInferTransaction(rawMessage, senderHint);

    const smartEntryDTO = createInferenceDTOFromDetection({
      transaction: parsed.transaction,
      rawMessage,
      senderHint,
      confidence: parsed.confidence,
      parsingStatus: parsed.parsingStatus,
      origin: parsed.origin,
      matchOrigin: parsed.origin,
      fieldConfidences: parsed.fieldConfidences,
      matchedCount: parsed.matchedCount,
      totalTemplates: parsed.totalTemplates,
      fieldScore: parsed.fieldScore,
      keywordScore: parsed.keywordScore,
      source: 'smart-paste',
    });

    const notificationReviewDTO = await buildInferenceDTO({
      rawMessage,
      senderHint,
      source: 'sms',
    });

    FIELDS.forEach((field) => {
      const fromSmartEntry = resolveFieldTier(field, {
        fieldConfidences: smartEntryDTO.fieldConfidences,
        confidence: smartEntryDTO.confidence,
        origin: smartEntryDTO.origin,
        matchOrigin: smartEntryDTO.matchOrigin,
        parsingStatus: smartEntryDTO.parsingStatus,
        transaction: smartEntryDTO.transaction,
      }).tier;

      const fromNotification = resolveFieldTier(field, {
        fieldConfidences: notificationReviewDTO.fieldConfidences,
        confidence: notificationReviewDTO.confidence,
        origin: notificationReviewDTO.origin,
        matchOrigin: notificationReviewDTO.matchOrigin,
        parsingStatus: notificationReviewDTO.parsingStatus,
        transaction: notificationReviewDTO.transaction,
      }).tier;

      expect(fromSmartEntry).toBe(fromNotification);
    });
  });
});
