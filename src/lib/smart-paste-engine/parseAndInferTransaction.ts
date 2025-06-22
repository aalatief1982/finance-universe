import { Transaction, TransactionType } from '@/types/transaction';
import { nanoid } from 'nanoid';
import { parseStructuredSms, applyVendorMapping } from './structureParser';
import { loadKeywordBank } from './keywordBankUtils';
import { getAllTemplates } from './templateUtils';
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
  parsed: ReturnType<typeof parseStructuredSms>;
}

/**
 * Given a raw message, extract transaction fields and compute confidence
 */
export function parseAndInferTransaction(
  rawMessage: string,
  senderHint?: string
): ParsedTransactionResult {
  const parsed = parseStructuredSms(rawMessage);

  const vendor = applyVendorMapping(
    parsed.inferredFields.vendor || parsed.directFields.vendor || ''
  );

  const parsedAmount = parseFloat(parsed.directFields.amount || '');
  const transaction: Transaction = {
    id: nanoid(),
    amount: isNaN(parsedAmount) ? 0 : parsedAmount,
    currency: parsed.directFields.currency || 'SAR',
    date: parsed.directFields.date || '',
    type: (parsed.inferredFields.type as TransactionType) || 'expense',
    category: parsed.inferredFields.category || 'Uncategorized',
    subcategory: parsed.inferredFields.subcategory || 'none',
    vendor,
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

  const origin: ParsedTransactionResult['origin'] = parsed.matched
    ? 'template'
    : 'structure';

  return {
    transaction,
    confidence: finalConfidence,
    origin,
    parsed,
  };
}
