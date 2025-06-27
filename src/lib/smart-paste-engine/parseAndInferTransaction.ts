import { Transaction, TransactionType } from '@/types/transaction';
import { nanoid } from 'nanoid';
import { parseSmsMessage } from './structureParser';
import { loadKeywordBank } from './keywordBankUtils';
import { getAllTemplates } from './templateUtils';
import { classifySmsViaCloud } from './cloudClassifier';
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
}

/**
 * Given a raw message, extract transaction fields and compute confidence
 */
export async function parseAndInferTransaction(
  rawMessage: string,
  senderHint?: string
): Promise<ParsedTransactionResult> {
  const parsed = parseSmsMessage(rawMessage);

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
  const finalConfidence = computeOverallConfidence(fieldScore, templateScore, keywordScore);

  let origin: ParsedTransactionResult['origin'] = parsed.matched
    ? 'template'
    : 'structure';

  if (!parsed.matched || finalConfidence < 0.5) {
    try {
      const cloud = await classifySmsViaCloud(rawMessage);
      Object.assign(transaction, cloud);
      origin = 'ml';
      return {
        transaction,
        confidence: cloud.confidence ?? finalConfidence,
        origin,
        parsed,
      };
    } catch (err) {
      console.warn('Cloud classifier failed:', err);
    }
  }

  return {
    transaction,
    confidence: finalConfidence,
    origin,
    parsed,
  };
}
