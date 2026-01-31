/**
 * @file draft-utils.ts
 * @description Draft transaction persistence helpers.
 *
 * @module lib/draft-utils
 *
 * @responsibilities
 * 1. Save draft transactions by ID
 * 2. Load draft transactions by ID
 *
 * @storage-keys
 * - xpensia_drafts: draft transactions map
 *
 * @dependencies
 * - safe-storage.ts: localStorage wrapper
 *
 * @review-tags
 * - @risk: JSON parsing on corrupted drafts
 *
 * @review-checklist
 * - [ ] Missing drafts return null
 * - [ ] Storage writes serialize full transaction
 */

import { safeStorage } from "@/utils/safe-storage";
import { Transaction } from '@/types/transaction';

export function setDraftTransaction(id: string, txn: Transaction) {
  const existing = JSON.parse(safeStorage.getItem('xpensia_drafts') || '{}');
  existing[id] = txn;
  safeStorage.setItem('xpensia_drafts', JSON.stringify(existing));
}

export function getDraftTransaction(id: string): Transaction | null {
  const drafts = JSON.parse(safeStorage.getItem('xpensia_drafts') || '{}');
  return drafts[id] || null;
}
