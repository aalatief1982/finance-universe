/**
 * @file freeformParser.ts
 * @description Bounded rule-based fallback parser for short freeform transaction phrases.
 *              Completely isolated from SMS template/structure parsing.
 *
 * @module lib/freeform-entry/freeformParser
 *
 * @responsibilities
 * 1. Extract amount from short text (EN + AR numerals)
 * 2. Detect transaction type via verb/keyword lists
 * 3. Resolve relative dates (today/yesterday)
 * 4. Extract counterparty from "to/from" markers
 * 5. Produce conservative category suggestions
 * 6. Return FreeformParseResult with per-field confidences
 *
 * @review-checklist
 * - [ ] Never references SMS template hashes, sender hints, or template banks
 * - [ ] Amount required as minimum gate
 * - [ ] Conservative category inference only
 */

import { normalizeNumerals } from '@/lib/normalize-utils';
import { deriveFreeformPhraseKey, lookupFreeformHint, lookupFreeformPhraseHint } from './freeformLearningStore';
import type { FreeformParseResult, FreeformFieldConfidences } from './freeformTypes';
import type { TransactionType } from '@/types/transaction';

// ============================================================================
// SECTION: Keyword / verb banks
// ============================================================================

const EXPENSE_VERBS = new Set([
  'paid', 'purchase', 'purchased', 'bought', 'spent', 'buy',
  'دفعت', 'شراء', 'اشتريت', 'صرفت',
]);

const INCOME_VERBS = new Set([
  'salary', 'credited', 'received', 'earned', 'bonus', 'income',
  'راتب', 'دخل', 'استلمت', 'مكافأة', 'ايراد', 'إيراد',
]);

const TRANSFER_VERBS = new Set([
  'transfer', 'transferred', 'sent', 'remittance', 'remit',
  'حولت', 'حوالة', 'تحويل', 'أرسلت', 'ارسلت',
]);

const TRANSFER_IN_VERBS = new Set([
  'received', 'استلمت', 'استقبلت',
]);

// Counterparty prepositions
const TO_MARKERS = new Set(['to', 'إلى', 'الى', 'لـ', 'ل']);
const FROM_MARKERS = new Set(['from', 'من']);

// Currency words/codes → currency code
const CURRENCY_MAP: Record<string, string> = {
  'sar': 'SAR', 'riyal': 'SAR', 'riyals': 'SAR', 'ريال': 'SAR', 'ريالات': 'SAR',
  'usd': 'USD', 'dollar': 'USD', 'dollars': 'USD', 'دولار': 'USD',
  'aed': 'AED', 'dirham': 'AED', 'dirhams': 'AED', 'درهم': 'AED',
  'egp': 'EGP', 'جنيه': 'EGP', 'pound': 'EGP', 'pounds': 'EGP',
  'eur': 'EUR', 'euro': 'EUR', 'euros': 'EUR', 'يورو': 'EUR',
  'gbp': 'GBP', 'kwd': 'KWD', 'bhd': 'BHD', 'qar': 'QAR', 'omr': 'OMR',
  'jod': 'JOD', 'دينار': 'KWD',
};

// Conservative keyword → category map
const KEYWORD_CATEGORY_MAP: Record<string, { category: string; subcategory: string }> = {
  // Food
  'coffee': { category: 'Food', subcategory: 'Coffee' },
  'قهوة': { category: 'Food', subcategory: 'Coffee' },
  'restaurant': { category: 'Food', subcategory: 'Restaurants' },
  'مطعم': { category: 'Food', subcategory: 'Restaurants' },
  'lunch': { category: 'Food', subcategory: 'Restaurants' },
  'dinner': { category: 'Food', subcategory: 'Restaurants' },
  'غداء': { category: 'Food', subcategory: 'Restaurants' },
  'عشاء': { category: 'Food', subcategory: 'Restaurants' },
  // Groceries
  'groceries': { category: 'Groceries', subcategory: 'none' },
  'بقالة': { category: 'Groceries', subcategory: 'none' },
  'سوبرماركت': { category: 'Groceries', subcategory: 'none' },
  'supermarket': { category: 'Groceries', subcategory: 'none' },
  // Transport
  'gas': { category: 'Transportation', subcategory: 'Fuel' },
  'fuel': { category: 'Transportation', subcategory: 'Fuel' },
  'بنزين': { category: 'Transportation', subcategory: 'Fuel' },
  'petrol': { category: 'Transportation', subcategory: 'Fuel' },
  'uber': { category: 'Transportation', subcategory: 'Ride' },
  'taxi': { category: 'Transportation', subcategory: 'Ride' },
  // Income
  'salary': { category: 'Income', subcategory: 'Salary' },
  'راتب': { category: 'Income', subcategory: 'Salary' },
  'bonus': { category: 'Income', subcategory: 'Bonus' },
  'مكافأة': { category: 'Income', subcategory: 'Bonus' },
  // Utilities
  'electricity': { category: 'Utilities', subcategory: 'Electricity' },
  'كهرباء': { category: 'Utilities', subcategory: 'Electricity' },
  'water': { category: 'Utilities', subcategory: 'Water' },
  'ماء': { category: 'Utilities', subcategory: 'Water' },
  'internet': { category: 'Utilities', subcategory: 'Internet' },
  'انترنت': { category: 'Utilities', subcategory: 'Internet' },
  // Medical
  'pharmacy': { category: 'Health', subcategory: 'Pharmacy' },
  'صيدلية': { category: 'Health', subcategory: 'Pharmacy' },
  'doctor': { category: 'Health', subcategory: 'Doctor' },
  'دكتور': { category: 'Health', subcategory: 'Doctor' },
};

// Relative date words
const TODAY_WORDS = new Set(['today', 'اليوم']);
const YESTERDAY_WORDS = new Set(['yesterday', 'أمس', 'امس', 'امبارح']);

// ============================================================================
// SECTION: Extraction helpers
// ============================================================================

const todayIso = (): string => new Date().toISOString().split('T')[0];

const yesterdayIso = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

/** Tokenize text preserving Arabic words */
function tokenize(text: string): string[] {
  return text
    .replace(/[,،.؛;:!?()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Check if a token is a number (after numeral normalization) */
function parseAmount(token: string): number | null {
  const normalized = normalizeNumerals(token).replace(/,/g, '');
  const num = parseFloat(normalized);
  return !isNaN(num) && num > 0 && num < 10_000_000 ? num : null;
}

// ============================================================================
// SECTION: Main parser
// ============================================================================

export function parseFreeformTransaction(rawText: string): FreeformParseResult {
  const text = rawText.trim();
  const tokens = tokenize(text);
  const lowerTokens = tokens.map(t => t.toLowerCase());

  // --- Amount extraction ---
  let amount = 0;
  let amountIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const parsed = parseAmount(tokens[i]);
    if (parsed !== null) {
      amount = parsed;
      amountIndex = i;
      break;
    }
  }

  if (amount === 0) {
    return makeFailResult();
  }

  // --- Currency extraction ---
  let currency = 'SAR'; // default
  let currencyConfidence = 0.3;
  const currencyIndicesToRemove = new Set<number>();
  // Check tokens adjacent to amount
  for (let i = 0; i < lowerTokens.length; i++) {
    if (i === amountIndex) continue;
    const mapped = CURRENCY_MAP[lowerTokens[i]];
    if (mapped) {
      currency = mapped;
      currencyConfidence = 0.9;
      currencyIndicesToRemove.add(i);
      break;
    }
  }

  // --- Type / intent detection ---
  let type: TransactionType = 'expense';
  let typeConfidence = 0.4; // default guess
  let counterparty = '';
  let counterpartyConfidence = 0;

  for (let i = 0; i < lowerTokens.length; i++) {
    const tok = lowerTokens[i];
    if (INCOME_VERBS.has(tok)) {
      type = 'income';
      typeConfidence = 0.85;
      break;
    }
    if (TRANSFER_VERBS.has(tok)) {
      type = 'transfer';
      typeConfidence = 0.8;
      break;
    }
    if (TRANSFER_IN_VERBS.has(tok) && lowerTokens.some(t => FROM_MARKERS.has(t))) {
      type = 'transfer';
      typeConfidence = 0.8;
      break;
    }
    if (EXPENSE_VERBS.has(tok)) {
      type = 'expense';
      typeConfidence = 0.85;
      break;
    }
  }

  // --- Counterparty extraction (for transfers) ---
  if (type === 'transfer' || type === 'income') {
    for (let i = 0; i < lowerTokens.length; i++) {
      if (TO_MARKERS.has(lowerTokens[i]) || FROM_MARKERS.has(lowerTokens[i])) {
        // Take next token(s) as counterparty name
        const parts: string[] = [];
        for (let j = i + 1; j < tokens.length && j <= i + 3; j++) {
          if (parseAmount(tokens[j]) !== null) break;
          if (CURRENCY_MAP[lowerTokens[j]]) break;
          parts.push(tokens[j]);
        }
        if (parts.length > 0) {
          counterparty = parts.join(' ');
          counterpartyConfidence = 0.75;
        }
        break;
      }
    }
    // Arabic attached preposition: لأحمد → ل + أحمد
    if (!counterparty) {
      for (const tok of tokens) {
        if (tok.startsWith('لـ') || tok.startsWith('ل')) {
          const name = tok.startsWith('لـ') ? tok.slice(2) : tok.slice(1);
          if (name.length >= 2 && parseAmount(name) === null) {
            counterparty = name;
            counterpartyConfidence = 0.7;
            type = 'transfer';
            typeConfidence = Math.max(typeConfidence, 0.75);
            break;
          }
        }
      }
    }
  }

  // --- Date extraction ---
  let date = todayIso();
  let dateDefaulted = true;
  let dateConfidence = 0.3;

  for (const tok of lowerTokens) {
    if (TODAY_WORDS.has(tok)) {
      date = todayIso();
      dateDefaulted = false;
      dateConfidence = 0.95;
      break;
    }
    if (YESTERDAY_WORDS.has(tok)) {
      date = yesterdayIso();
      dateDefaulted = false;
      dateConfidence = 0.9;
      break;
    }
  }

  // --- Title / vendor residue ---
  const skipIndices = new Set<number>([amountIndex, ...currencyIndicesToRemove]);
  const verbSet = new Set([...EXPENSE_VERBS, ...INCOME_VERBS, ...TRANSFER_VERBS, ...TRANSFER_IN_VERBS]);
  const dateWordSet = new Set([...TODAY_WORDS, ...YESTERDAY_WORDS]);
  const prepSet = new Set([...TO_MARKERS, ...FROM_MARKERS]);

  const residueTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (skipIndices.has(i)) continue;
    const low = lowerTokens[i];
    if (verbSet.has(low)) continue;
    if (dateWordSet.has(low)) continue;
    if (prepSet.has(low)) continue;
    if (CURRENCY_MAP[low]) continue;
    // Skip counterparty tokens if already captured
    if (counterparty && counterparty.includes(tokens[i])) continue;
    residueTokens.push(tokens[i]);
  }

  let title = residueTokens.join(' ').trim();
  let titleConfidence = title.length > 0 ? 0.6 : 0.2;

  // --- Category inference ---
  let category = 'Uncategorized';
  let subcategory = 'none';
  let categoryConfidence = 0.2;

  // Check keyword map against all tokens
  for (const tok of lowerTokens) {
    const match = KEYWORD_CATEGORY_MAP[tok];
    if (match) {
      category = match.category;
      subcategory = match.subcategory;
      categoryConfidence = 0.7;
      break;
    }
  }

  // Income-type keywords also set category
  if (type === 'income' && category === 'Uncategorized') {
    category = 'Income';
    categoryConfidence = 0.6;
  }

  // --- Freeform learning lookup (exact normalized vendor only) ---
  const lookupKey = title || (residueTokens[0] ?? '');
  const learnedAppliedFields: Array<'category' | 'subcategory' | 'type' | 'currency'> = [];
  let learnedSource: 'freeform-vendor' | 'freeform-phrase' | undefined;
  let learnedNormalizedVendor: string | undefined;
  let learnedNormalizedPhraseKey: string | undefined;

  if (lookupKey) {
    const hint = lookupFreeformHint(lookupKey);
    if (hint) {
      learnedNormalizedVendor = hint.normalizedVendor;

      // Apply only when parser does not already have stronger evidence.
      if (hint.category && categoryConfidence < 0.7) {
        category = hint.category;
        learnedAppliedFields.push('category');
        if (hint.subcategory) {
          subcategory = hint.subcategory;
          learnedAppliedFields.push('subcategory');
        }
        categoryConfidence = Math.min(0.75, 0.45 + hint.confirmedCount * 0.08);
      }

      if (hint.type && typeConfidence < 0.8) {
        type = hint.type;
        learnedAppliedFields.push('type');
        typeConfidence = Math.min(0.78, 0.5 + hint.confirmedCount * 0.08);
      }

      if (hint.currency && currencyConfidence < 0.9) {
        currency = hint.currency;
        learnedAppliedFields.push('currency');
        currencyConfidence = Math.min(0.8, 0.45 + hint.confirmedCount * 0.08);
      }

      if (learnedAppliedFields.length > 0) {
        learnedSource = 'freeform-vendor';
      }
    }
  }

  if (learnedAppliedFields.length === 0) {
    const phraseHint = lookupFreeformPhraseHint(text);
    if (phraseHint) {
      learnedNormalizedPhraseKey = phraseHint.normalizedPhraseKey;

      if (phraseHint.category && categoryConfidence < 0.7) {
        category = phraseHint.category;
        learnedAppliedFields.push('category');
        if (phraseHint.subcategory) {
          subcategory = phraseHint.subcategory;
          learnedAppliedFields.push('subcategory');
        }
        categoryConfidence = Math.min(0.75, 0.45 + phraseHint.confirmedCount * 0.08);
      }

      if (phraseHint.type && typeConfidence < 0.8) {
        type = phraseHint.type;
        learnedAppliedFields.push('type');
        typeConfidence = Math.min(0.78, 0.5 + phraseHint.confirmedCount * 0.08);
      }

      if (phraseHint.currency && currencyConfidence < 0.9) {
        currency = phraseHint.currency;
        learnedAppliedFields.push('currency');
        currencyConfidence = Math.min(0.8, 0.45 + phraseHint.confirmedCount * 0.08);
      }

      if (learnedAppliedFields.length > 0) {
        learnedSource = 'freeform-phrase';
      }
    }
  }

  // If no title but we have category keyword, use that as title
  if (!title && category !== 'Uncategorized') {
    for (const tok of tokens) {
      if (KEYWORD_CATEGORY_MAP[tok.toLowerCase()]) {
        title = tok;
        titleConfidence = 0.5;
        break;
      }
    }
  }

  // Use counterparty as title for transfers if no other title
  if (!title && counterparty) {
    title = counterparty;
    titleConfidence = 0.5;
  }

  // Fallback title
  if (!title) {
    title = 'Transaction';
    titleConfidence = 0.1;
  }

  // --- Confidence computation ---
  const fieldConfidences: FreeformFieldConfidences = {
    amount: 0.95, // amount was found, high confidence
    type: typeConfidence,
    date: dateConfidence,
    title: titleConfidence,
    category: categoryConfidence,
    currency: currencyConfidence,
    counterparty: counterpartyConfidence,
  };

  // Weighted overall confidence
  const confidence = Math.round((
    fieldConfidences.amount * 0.35 +
    fieldConfidences.type * 0.2 +
    fieldConfidences.date * 0.1 +
    fieldConfidences.title * 0.15 +
    fieldConfidences.category * 0.15 +
    fieldConfidences.currency * 0.05
  ) * 100) / 100;

  return {
    success: true,
    amount,
    type,
    date,
    dateDefaulted,
    title,
    category,
    subcategory,
    currency,
    counterparty,
    fieldConfidences,
    confidence,
    learnedMappingApplied:
      learnedSource && learnedAppliedFields.length > 0
        ? {
            source: learnedSource,
            normalizedVendor: learnedNormalizedVendor,
            normalizedPhraseKey: learnedNormalizedPhraseKey || deriveFreeformPhraseKey(text),
            appliedFields: learnedAppliedFields,
          }
        : undefined,
  };
}

function makeFailResult(): FreeformParseResult {
  return {
    success: false,
    amount: 0,
    type: 'expense',
    date: todayIso(),
    dateDefaulted: true,
    title: '',
    category: 'Uncategorized',
    subcategory: 'none',
    currency: 'SAR',
    counterparty: '',
    fieldConfidences: {
      amount: 0, type: 0, date: 0, title: 0, category: 0, currency: 0, counterparty: 0,
    },
    confidence: 0,
  };
}
