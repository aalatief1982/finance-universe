/**
 * @file freeformLearningStore.ts
 * @description Isolated localStorage-backed learning store for freeform/manual/voice input.
 *              NEVER reads or writes SMS template banks, keyword banks, or sender-based logic.
 *
 * @module lib/freeform-entry/freeformLearningStore
 *
 * @storage-keys
 * - xpensia_freeform_learned_mappings: FreeformLearnedMapping[]
 * - xpensia_freeform_phrase_mappings: FreeformPhraseLearnedMapping[]
 */

import { normalizeNumerals } from '@/lib/normalize-utils';
import { safeStorage } from '@/utils/safe-storage';
import type { Transaction } from '@/types/transaction';
import type { FreeformLearnedMapping, FreeformPhraseLearnedMapping, FreeformPhraseLearningKey } from './freeformTypes';

const VENDOR_STORAGE_KEY = 'xpensia_freeform_learned_mappings';
const PHRASE_STORAGE_KEY = 'xpensia_freeform_phrase_mappings';

const GENERIC_PHRASE_WORDS = new Set([
  'coffee', 'salary', 'rent', 'groceries', 'grocery', 'bonus', 'income',
  'قهوة', 'راتب', 'إيجار', 'ايجار', 'دخل', 'مكافأة',
]);

const EXPENSE_VERBS = new Set(['paid', 'purchase', 'purchased', 'bought', 'spent', 'buy', 'دفعت', 'شراء', 'اشتريت', 'صرفت']);
const INCOME_VERBS = new Set(['salary', 'credited', 'received', 'earned', 'bonus', 'income', 'راتب', 'دخل', 'استلمت', 'مكافأة', 'ايراد', 'إيراد']);
const TRANSFER_VERBS = new Set(['transfer', 'transferred', 'sent', 'remittance', 'remit', 'حولت', 'حوالة', 'تحويل', 'أرسلت', 'ارسلت']);
const TRANSFER_IN_VERBS = new Set(['received', 'استلمت', 'استقبلت']);
const INCOME_NOUN_PHRASE_HEADS = new Set(['salary', 'راتب']);
const TO_MARKERS = new Set(['to', 'إلى', 'الى', 'لـ', 'ل']);
const FROM_MARKERS = new Set(['from', 'من']);
const TODAY_WORDS = new Set(['today', 'اليوم']);
const YESTERDAY_WORDS = new Set(['yesterday', 'أمس', 'امس', 'امبارح']);
const CURRENCY_TOKENS = new Set([
  'sar', 'riyal', 'riyals', 'ريال', 'ريالات',
  'usd', 'dollar', 'dollars', 'دولار',
  'aed', 'dirham', 'dirhams', 'درهم',
  'egp', 'جنيه', 'pound', 'pounds',
  'eur', 'euro', 'euros', 'يورو',
  'gbp', 'kwd', 'bhd', 'qar', 'omr', 'jod', 'دينار',
]);

// ============================================================================
// SECTION: Load / Save
// ============================================================================

export function loadFreeformMappings(): FreeformLearnedMapping[] {
  try {
    const raw = safeStorage.getItem(VENDOR_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFreeformMappings(mappings: FreeformLearnedMapping[]): void {
  safeStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(mappings));
}

export function loadFreeformPhraseMappings(): FreeformPhraseLearnedMapping[] {
  try {
    const raw = safeStorage.getItem(PHRASE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFreeformPhraseMappings(mappings: FreeformPhraseLearnedMapping[]): void {
  safeStorage.setItem(PHRASE_STORAGE_KEY, JSON.stringify(mappings));
}

// ============================================================================
// SECTION: Normalize / Phrase key
// ============================================================================

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokenize(text: string): string[] {
  return text
    .replace(/[,،.؛;:!?()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function isAmountToken(token: string): boolean {
  const normalized = normalizeNumerals(token).replace(/,/g, '');
  const parsed = parseFloat(normalized);
  return !isNaN(parsed) && parsed > 0;
}

export function deriveFreeformPhraseKey(rawText: string): FreeformPhraseLearningKey | undefined {
  const text = rawText?.trim();
  if (!text) return undefined;

  const tokens = tokenize(text);
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const hasFrom = lowerTokens.some((t) => FROM_MARKERS.has(t));
  const hasTransferVerb = lowerTokens.some((t) => TRANSFER_VERBS.has(t));
  const hasTransferInVerb = lowerTokens.some((t) => TRANSFER_IN_VERBS.has(t));

  if (hasTransferVerb || (hasTransferInVerb && hasFrom)) {
    return hasFrom ? 'received-from-person' : 'transfer-out';
  }

  // Preserve noun-headed salary phrases (e.g. "salary 12000", "راتب 12000")
  // so they can be learned over repeated confirmations.
  if (tokens.length > 0 && INCOME_NOUN_PHRASE_HEADS.has(lowerTokens[0]) && tokens.some(isAmountToken)) {
    return normalizeKey(tokens[0]);
  }

  const residue: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const low = lowerTokens[i];
    if (isAmountToken(tokens[i])) continue;
    if (CURRENCY_TOKENS.has(low)) continue;
    if (EXPENSE_VERBS.has(low) || INCOME_VERBS.has(low) || TRANSFER_IN_VERBS.has(low)) continue;
    if (TODAY_WORDS.has(low) || YESTERDAY_WORDS.has(low)) continue;
    if (TO_MARKERS.has(low) || FROM_MARKERS.has(low)) continue;
    residue.push(tokens[i]);
  }

  if (residue.length === 0) return undefined;
  return normalizeKey(residue[0]);
}

function shouldPreferPhraseLearning(vendorOrTitle: string, phraseKey: string | undefined, confirmedTransaction: Transaction): boolean {
  if (!phraseKey) return false;
  if (phraseKey === 'transfer-out' || phraseKey === 'received-from-person') return true;
  if (confirmedTransaction.type === 'transfer') return true;

  const normalizedVendor = normalizeKey(vendorOrTitle || '');
  if (!normalizedVendor) return true;
  if (normalizedVendor !== phraseKey) return false;

  return GENERIC_PHRASE_WORDS.has(phraseKey);
}

// ============================================================================
// SECTION: Lookup
// ============================================================================

/**
 * Look up a previously learned mapping for a vendor/phrase.
 * Returns the mapping if found, undefined otherwise.
 */
export function lookupFreeformHint(
  vendor: string,
): FreeformLearnedMapping | undefined {
  if (!vendor?.trim()) return undefined;
  const key = normalizeKey(vendor);
  const mappings = loadFreeformMappings();
  return mappings.find((m) => m.normalizedVendor === key);
}

export function lookupFreeformPhraseHint(rawText: string): FreeformPhraseLearnedMapping | undefined {
  const phraseKey = deriveFreeformPhraseKey(rawText);
  if (!phraseKey) return undefined;
  const mappings = loadFreeformPhraseMappings();
  return mappings.find((m) => m.normalizedPhraseKey === phraseKey);
}

// ============================================================================
// SECTION: Learn from confirmed save
// ============================================================================

/**
 * Record a freeform learning signal from a user-confirmed transaction save.
 * Only called for freeform/voice sources. Never touches SMS stores.
 */
export function learnFromFreeformConfirmation(
  rawText: string,
  vendorOrTitle: string,
  confirmedTransaction: Transaction,
): void {
  const phraseKey = deriveFreeformPhraseKey(rawText);
  if (shouldPreferPhraseLearning(vendorOrTitle, phraseKey, confirmedTransaction)) {
    if (!phraseKey || phraseKey.length < 2) return;

    const mappings = loadFreeformPhraseMappings();
    const existing = mappings.find((m) => m.normalizedPhraseKey === phraseKey);

    if (existing) {
      existing.category = confirmedTransaction.category;
      existing.subcategory = confirmedTransaction.subcategory || 'none';
      existing.type = confirmedTransaction.type;
      if (confirmedTransaction.currency) {
        existing.currency = confirmedTransaction.currency;
      }
      existing.confirmedCount += 1;
      existing.lastConfirmedAt = new Date().toISOString();
    } else {
      mappings.push({
        normalizedPhraseKey: phraseKey,
        category: confirmedTransaction.category,
        subcategory: confirmedTransaction.subcategory || 'none',
        type: confirmedTransaction.type,
        currency: confirmedTransaction.currency,
        confirmedCount: 1,
        lastConfirmedAt: new Date().toISOString(),
      });
    }

    saveFreeformPhraseMappings(mappings);
    return;
  }

  const vendorKey = normalizeKey(vendorOrTitle);
  if (!vendorKey || vendorKey.length < 2) return;

  const mappings = loadFreeformMappings();
  const existing = mappings.find((m) => m.normalizedVendor === vendorKey);

  if (existing) {
    existing.category = confirmedTransaction.category;
    existing.subcategory = confirmedTransaction.subcategory || 'none';
    existing.type = confirmedTransaction.type;
    if (confirmedTransaction.currency) {
      existing.currency = confirmedTransaction.currency;
    }
    existing.confirmedCount += 1;
    existing.lastConfirmedAt = new Date().toISOString();
  } else {
    mappings.push({
      normalizedVendor: vendorKey,
      category: confirmedTransaction.category,
      subcategory: confirmedTransaction.subcategory || 'none',
      type: confirmedTransaction.type,
      currency: confirmedTransaction.currency,
      confirmedCount: 1,
      lastConfirmedAt: new Date().toISOString(),
    });
  }

  saveFreeformMappings(mappings);
}
