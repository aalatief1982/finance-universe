import { Transaction, TransactionType } from '@/types/transaction';
import { nanoid } from 'nanoid';
import { parseSmsMessage } from './structureParser';
import { loadKeywordBank } from './keywordBankUtils';
import { getAllTemplates } from './templateUtils';
import { classifySmsViaCloud } from './cloudClassifier';
import { logParsingFailure } from '@/utils/parsingLogger';
import {
  getFieldConfidence,
  getTemplateConfidence,
  getKeywordConfidence,
  computeOverallConfidence,
} from './confidenceScoring';

export interface ParsedTransactionResult {
  transaction: Transaction;
  confidence: number;
  origin: 'template' | 'structure' | 'ml' | 'fallback';
  parsed: ReturnType<typeof parseSmsMessage>;
  fieldConfidences: Record<string, number>;
  parsingStatus: 'success' | 'partial' | 'failed';
  matchedCount: number;
  totalTemplates: number;
  fieldScore: number;
  keywordScore: number;
}

/**
 * Given a raw message, extract transaction fields and compute confidence
 */
export async function parseAndInferTransaction(
  rawMessage: string,
  senderHint?: string,
  smsId?: string
): Promise<ParsedTransactionResult> {
  const parsed = parseSmsMessage(rawMessage, senderHint);

  const transaction: Transaction = {
    id: nanoid(),
    amount: parseFloat(parsed.directFields.amount || '0'),
    currency: parsed.directFields.currency || 'SAR',
    date: parsed.directFields.date || '',
    type: (parsed.inferredFields.type as TransactionType) || 'expense',
    category: parsed.inferredFields.category || 'Uncategorized',
    subcategory: parsed.inferredFields.subcategory || 'none',
    vendor: parsed.inferredFields.vendor || parsed.directFields.vendor || '',
    fromAccount:
      parsed.directFields.fromAccount ||
      parsed.inferredFields.fromAccount ||
      parsed.defaultValues?.fromAccount ||
      senderHint || '',
    source: 'smart-paste',
    createdAt: new Date().toISOString(),
    title: '', // editable in form later
  };

  // Confidence scoring
  const keywordBank = loadKeywordBank();
  const templates = getAllTemplates();
  const matchedTemplates = templates.filter(t => t.template.includes(transaction.vendor)).length;

  const fieldScore = getFieldConfidence(parsed);
  const templateScore = getTemplateConfidence(matchedTemplates, templates.length);
  const keywordScore = getKeywordConfidence(transaction, keywordBank);
  const finalConfidence = computeOverallConfidence(
    fieldScore,
    templateScore,
    keywordScore
  );

  const fields = [
    'amount',
    'currency',
    'date',
    'type',
    'category',
    'subcategory',
    'vendor',
    'fromAccount',
  ];
  const fieldConfidences: Record<string, number> = {};
  fields.forEach((f) => {
    if (parsed.directFields?.[f]) fieldConfidences[f] = 1;
    else if (parsed.inferredFields?.[f]) fieldConfidences[f] = 0.6;
    else if (parsed.defaultValues?.[f]) fieldConfidences[f] = 0.4;
    else fieldConfidences[f] = 0;
  });

  const parsingStatus: ParsedTransactionResult['parsingStatus'] =
    finalConfidence >= 0.8
      ? 'success'
      : finalConfidence >= 0.4
        ? 'partial'
        : 'failed';

  let origin: ParsedTransactionResult['origin'] = parsed.matched
    ? 'template'
    : 'structure';

  if (!parsed.matched || finalConfidence < 0.5) {
    try {
      const cloud = await classifySmsViaCloud(rawMessage);
      Object.assign(transaction, cloud);
      origin = 'ml';
      const cloudConfidence = cloud.confidence ?? finalConfidence;
      const cloudStatus: ParsedTransactionResult['parsingStatus'] =
        cloudConfidence >= 0.8
          ? 'success'
          : cloudConfidence >= 0.4
            ? 'partial'
            : 'failed';
      if (cloudStatus === 'failed' && smsId) {
        logParsingFailure(smsId);
      }
      return {
        transaction,
        confidence: cloudConfidence,
        origin,
        parsed,
        fieldConfidences,
        parsingStatus: cloudStatus,
        matchedCount: matchedTemplates,
        totalTemplates: templates.length,
        fieldScore,
        keywordScore,
      };
    } catch (err) {
      console.warn('Cloud classifier failed:', err);
    }
  }

  if (parsingStatus === 'failed' && smsId) {
    logParsingFailure(smsId);
  }

  return {
    transaction,
    confidence: finalConfidence,
    origin,
    parsed,
    fieldConfidences,
    parsingStatus,
    matchedCount: matchedTemplates,
    totalTemplates: templates.length,
    fieldScore,
    keywordScore,
  };
}
