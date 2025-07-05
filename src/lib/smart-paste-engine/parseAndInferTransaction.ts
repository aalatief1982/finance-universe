import { Transaction, TransactionType } from '@/types/transaction';
import { nanoid } from 'nanoid';
import { parseSmsMessage } from './structureParser';
import { loadKeywordBank } from './keywordBankUtils';
import { getAllTemplates, incrementTemplateFailure } from './templateUtils';
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
    amount: parseFloat(parsed.directFields.amount?.value || '0'),
    currency: parsed.directFields.currency?.value || 'SAR',
    date: parsed.directFields.date?.value || '',
    type: (parsed.inferredFields.type?.value as TransactionType) || 'expense',
    category: parsed.inferredFields.category?.value || 'Uncategorized',
    subcategory: parsed.inferredFields.subcategory?.value || 'none',
    vendor:
      parsed.inferredFields.vendor?.value ||
      parsed.directFields.vendor?.value ||
      '',
    fromAccount:
      parsed.directFields.fromAccount?.value ||
      parsed.inferredFields.fromAccount?.value ||
      parsed.defaultValues?.fromAccount?.value ||
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
    if (parsed.directFields?.[f]) fieldConfidences[f] = parsed.directFields[f].confidenceScore;
    else if (parsed.inferredFields?.[f]) fieldConfidences[f] = parsed.inferredFields[f].confidenceScore;
    else if (parsed.defaultValues?.[f]) fieldConfidences[f] = parsed.defaultValues[f].confidenceScore;
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

  if (parsed.matched && parsingStatus === 'failed') {
    incrementTemplateFailure(
      parsed.templateHash,
      senderHint,
      rawMessage,
      parsed.template
    );
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
