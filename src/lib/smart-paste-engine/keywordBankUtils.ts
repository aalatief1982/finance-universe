/**
 * @file keywordBankUtils.ts
 * @description Keyword bank storage and retrieval for Smart Paste inference.
 *              Maps keywords to transaction field values.
 *
 * @responsibilities
 * - Load/save keyword bank from localStorage
 * - Delete keyword entries
 * - Support context-aware keyword mappings (sender, type)
 *
 * @storage-keys
 * - xpensia_keyword_bank: Array of keyword-to-field mappings
 *
 * @dependencies
 * - safe-storage.ts: localStorage wrapper
 *
 * @review-checklist
 * - [ ] Keyword deletion is case-insensitive
 * - [ ] Mappings array preserved on save
 */

import { safeStorage } from "@/utils/safe-storage";

const KEY = 'xpensia_keyword_bank';

// ============================================================================
// SECTION: Type Definitions
// ============================================================================

export interface KeywordEntry {
  keyword: string
  type: string
  lastUpdated?: string
  mappingCount?: number
  /** Optional: keyword applies only for this sender */
  senderContext?: string
  /** Optional: keyword applies only for this transaction type */
  transactionTypeContext?: string
  mappings: {
    field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor'
    value: string
  }[]
}

// ============================================================================
// SECTION: Keyword Bank CRUD
// PURPOSE: Load/save/delete keyword mappings
// ============================================================================

export function loadKeywordBank(): KeywordEntry[] {
  const raw = safeStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveKeywordBank(bank: KeywordEntry[]) {
  safeStorage.setItem(KEY, JSON.stringify(bank));
}

/**
 * Delete a keyword entry from the bank.
 * Case-insensitive matching.
 */
export function deleteKeyword(keyword: string) {
  const bank = loadKeywordBank();
  const updated = bank.filter(entry => entry.keyword.toLowerCase() !== keyword.toLowerCase());
  saveKeywordBank(updated);
}
