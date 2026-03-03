import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { normalizeInferenceDTO, type InferenceDTO } from './inferenceDTO';
import { createInferenceDTOFromDetection } from './createInferenceDTOFromDetection';

interface BuildInferenceDTOArgs {
  rawMessage: string;
  senderHint?: string;
  smsId?: string;
  source?: 'smart-paste' | 'sms' | 'sms-import';
}

export async function buildInferenceDTO({
  rawMessage,
  senderHint,
  smsId,
  source = 'smart-paste',
}: BuildInferenceDTOArgs): Promise<InferenceDTO> {
  try {
    const result = await parseAndInferTransaction(rawMessage, senderHint, smsId);

    return createInferenceDTOFromDetection({
      transaction: result.transaction,
      rawMessage,
      senderHint,
      confidence: result.confidence,
      parsingStatus: result.parsingStatus,
      origin: result.origin,
      fieldConfidences: result.fieldConfidences,
      matchedCount: result.matchedCount,
      totalTemplates: result.totalTemplates,
      fieldScore: result.fieldScore,
      keywordScore: result.keywordScore,
      source,
    });
  } catch (error) {
    console.error('[buildInferenceDTO] Falling back to default inference DTO', {
      errorCode: 'INFERENCE_DTO_FALLBACK',
      module: 'lib/inference/buildInferenceDTO',
      fn: 'buildInferenceDTO',
      source,
      hasSenderHint: Boolean(senderHint),
      hasRawMessage: Boolean(rawMessage?.trim()),
      error,
    });

    return normalizeInferenceDTO({
      transaction: {
        id: '',
        title: senderHint ? `SMS from ${senderHint}` : 'SMS transaction',
        amount: 0,
        category: 'Uncategorized',
        subcategory: 'none',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        source,
        currency: 'SAR',
        fromAccount: senderHint || '',
      },
      rawMessage,
      senderHint,
      confidence: 0,
      parsingStatus: 'partial',
      origin: 'fallback',
      matchOrigin: 'fallback',
      fieldConfidences: {},
      matchedCount: 0,
      totalTemplates: 0,
      fieldScore: 0,
      keywordScore: 0,
      mode: 'create',
      isSuggested: true,
    });
  }
}
