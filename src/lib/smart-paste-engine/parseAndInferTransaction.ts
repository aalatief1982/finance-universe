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

// String similarity function for template matching
function getSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

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
      parsed.directFields.account?.value ||
      parsed.inferredFields.fromAccount?.value ||
      parsed.defaultValues?.fromAccount?.value ||
      senderHint || '',
    source: 'smart-paste',
    createdAt: new Date().toISOString(),
    title: '', // editable in form later
  };

  const keywordBank = loadKeywordBank();
  const templates = getAllTemplates();
  
  // Template confidence: check for exact match first, then slight match
  let templateMatched = 0;
  const totalTemplates = templates.length;
  
  if (parsed.matched) {
    // Exact template match
    templateMatched = 1;
  } else {
    // Check for slight matches - if template structure is similar to existing ones
    const currentStructure = parsed.template;
    const similarTemplates = templates.filter(t => {
      const similarity = getSimilarity(currentStructure, t.template);
      return similarity > 0.7; // 70% similarity threshold
    });
    
    if (similarTemplates.length > 0) {
      templateMatched = 0.6; // Partial confidence for slight matches
    }
  }

  const fieldScore = getFieldConfidence(parsed);
  const templateScore = getTemplateConfidence(templateMatched, totalTemplates);
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
    else if (f === 'fromAccount' && parsed.directFields?.account) fieldConfidences[f] = parsed.directFields.account.confidenceScore;
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
    matchedCount: templateMatched,
    totalTemplates: templates.length,
    fieldScore,
    keywordScore,
  };
}
