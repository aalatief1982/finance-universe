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
