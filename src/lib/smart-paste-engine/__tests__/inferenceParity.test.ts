import { describe, expect, it } from 'vitest';
import { parseAndInferTransaction } from '../parseAndInferTransaction';
import { normalizeInferenceDTO, type InferenceDTO } from '@/lib/inference/inferenceDTO';
import { inferenceParityFixtures } from './inferenceParity.fixtures';

interface FlowInput {
  senderHint?: string;
  smsId?: string;
  source: 'smart-paste' | 'sms' | 'sms-import';
}

interface CoreFields {
  type: string;
  amount: number;
  currency: string;
  date: string;
  vendor: string;
  category: string;
  subcategory: string;
  fromAccount?: string;
  toAccount?: string;
}

const extractCoreFields = (dto: InferenceDTO): CoreFields => ({
  type: dto.transaction.type,
  amount: dto.transaction.amount,
  currency: dto.transaction.currency,
  date: dto.transaction.date,
  vendor: dto.transaction.vendor || '',
  category: dto.transaction.category,
  subcategory: dto.transaction.subcategory,
  fromAccount: dto.transaction.fromAccount,
  toAccount: dto.transaction.toAccount,
});

const requiredDtoAssertions = (dto: InferenceDTO) => {
  expect(dto).toBeDefined();
  expect(dto.rawMessage).toBeTypeOf('string');
  expect(dto.transaction).toBeDefined();
  expect(dto.transaction.type).toBeTypeOf('string');
  expect(dto.transaction.amount).toBeTypeOf('number');
  expect(dto.transaction.currency).toBeTypeOf('string');
  expect(dto.transaction.date).toBeTypeOf('string');
  expect(dto.transaction.category).toBeTypeOf('string');
  expect(dto.transaction.subcategory).toBeTypeOf('string');
  expect(dto.fieldConfidences).toBeTypeOf('object');
  expect(dto.mode).toBe('create');
  expect(dto.isSuggested).toBe(true);
};

const runCanonicalInference = async (
  rawMessage: string,
  flow: FlowInput,
): Promise<InferenceDTO> => {
  const result = await parseAndInferTransaction(rawMessage, flow.senderHint, flow.smsId);

  return normalizeInferenceDTO({
    transaction: {
      ...result.transaction,
      source: flow.source,
    },
    rawMessage,
    senderHint: flow.senderHint,
    templateHash: result.parsed.templateHash,
    confidence: result.confidence,
    parsingStatus: result.parsingStatus,
    origin: result.origin,
    matchOrigin: result.origin,
    fieldConfidences: result.fieldConfidences,
    matchedCount: result.matchedCount,
    totalTemplates: result.totalTemplates,
    fieldScore: result.fieldScore,
    keywordScore: result.keywordScore,
    mode: 'create',
    isSuggested: true,
  });
};

describe('inference drift gate: parity across wrappers', () => {
  it('keeps core fields and template hash stable across Smart Entry / Listener / Bulk flows', async () => {
    const allRuns: Array<{
      fixture: (typeof inferenceParityFixtures)[number];
      smartEntry: InferenceDTO;
      listener: InferenceDTO;
      bulkImport: InferenceDTO;
    }> = [];

    for (const fixture of inferenceParityFixtures) {
      const smartEntry = await runCanonicalInference(fixture.message, {
        senderHint: fixture.senderHint,
        source: 'smart-paste',
      });
      const listener = await runCanonicalInference(fixture.message, {
        senderHint: fixture.senderHint,
        source: 'sms',
      });
      const bulkImport = await runCanonicalInference(fixture.message, {
        senderHint: fixture.senderHint,
        smsId: `sms-${fixture.id}`,
        source: 'sms-import',
      });

      allRuns.push({ fixture, smartEntry, listener, bulkImport });
    }

    allRuns.forEach(({ smartEntry, listener, bulkImport }) => {
      requiredDtoAssertions(smartEntry);
      requiredDtoAssertions(listener);
      requiredDtoAssertions(bulkImport);

      const smartCore = extractCoreFields(smartEntry);
      const listenerCore = extractCoreFields(listener);
      const bulkCore = extractCoreFields(bulkImport);

      expect(listenerCore).toEqual(bulkCore);
      expect(smartCore.amount).toBe(listenerCore.amount);
      expect(smartCore.currency).toBe(listenerCore.currency);
      expect(smartCore.date).toBe(listenerCore.date);
      expect(smartCore.vendor).toBe(listenerCore.vendor);
      expect(smartCore.category).toBe(listenerCore.category);
      expect(smartCore.subcategory).toBe(listenerCore.subcategory);

      if (listenerCore.fromAccount || bulkCore.fromAccount) {
        expect(smartCore.fromAccount).toBe(listenerCore.fromAccount);
      }

      if (listenerCore.toAccount || bulkCore.toAccount) {
        expect(smartCore.toAccount).toBe(listenerCore.toAccount);
      }

      expect(smartEntry.templateHash).toBe(listener.templateHash);
      expect(listener.templateHash).toBe(bulkImport.templateHash);
    });
  });

  it('uses identical template hash for duplicate messages after normalization', async () => {
    const duplicateMessages = inferenceParityFixtures.filter((fixture) => fixture.id.startsWith('dup-template'));
    expect(duplicateMessages.length).toBe(2);

    const first = await runCanonicalInference(duplicateMessages[0].message, {
      senderHint: duplicateMessages[0].senderHint,
      source: 'sms',
    });

    const second = await runCanonicalInference(duplicateMessages[1].message, {
      senderHint: duplicateMessages[1].senderHint,
      smsId: 'sms-duplicate-2',
      source: 'sms-import',
    });

    expect(first.templateHash).toBeDefined();
    expect(first.templateHash).toBe(second.templateHash);
  });
});
