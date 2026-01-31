/**
 * @file saveTransactionWithLearning.ts
 * @description Orchestrates transaction saving with Smart Paste learning.
 *              Persists transaction, updates template bank, and stores mappings.
 *
 * @responsibilities
 * - Validate and persist transaction to storage
 * - Extract template structure and save to template bank
 * - Update keyword bank with category mappings
 * - Store vendor and fromAccount remappings
 * - Update template default values for future parsing
 *
 * @storage-keys
 * - xpensia_transactions: Transaction storage
 * - xpensia_template_bank: Template storage
 * - xpensia_keyword_bank: Keyword mappings
 * - xpensia_vendor_map: Vendor name corrections
 * - xpensia_fromaccount_map: Account name corrections
 *
 * @dependencies
 * - templateUtils.ts: extractTemplateStructure, saveNewTemplate, etc.
 * - keywordBankUtils.ts: loadKeywordBank, saveKeywordBank
 * - storage-utils.ts: storeTransaction
 * - transaction-validator.ts: validateTransactionInput
 *
 * @review-checklist
 * - [ ] Validation runs before any persistence
 * - [ ] Template saved only for smart-paste source transactions
 * - [ ] Keyword mappings don't duplicate existing entries
 * - [ ] Vendor/account remaps stored for future inference
 *
 * @review-tags
 * - @side-effects: Multiple localStorage writes
 * - @review-focus: Learning trigger conditions (lines 58-134)
 */

import { safeStorage } from "@/utils/safe-storage";
import { Transaction } from '@/types/transaction';
import { validateTransactionInput } from '../transaction-validator';
import { v4 as uuidv4 } from 'uuid';
import { extractTemplateStructure, saveNewTemplate, loadTemplateBank, saveTemplateBank, getTemplateKey } from './templateUtils';
import { loadKeywordBank, saveKeywordBank, KeywordEntry } from './keywordBankUtils';
import { storeTransaction } from '@/utils/storage-utils';
import { toast } from '@/components/ui/use-toast';

// ============================================================================
// SECTION: Save Options Interface
// ============================================================================

interface SaveOptions {
  rawMessage?: string;
  isNew: boolean;
  senderHint?: string;
  addTransaction: (txn: Transaction) => void;
  updateTransaction: (txn: Transaction) => void;
  learnFromTransaction: (msg: string, txn: Transaction, hint: string) => void;
  navigateBack: () => void;
  silent?: boolean;
  showPatternToast?: boolean;
  combineToasts?: boolean;
}

// ============================================================================
// SECTION: Main Save Function
// PURPOSE: Validate, persist, and learn from transaction
// REVIEW: Learning only triggers for smart-paste source with rawMessage
// ============================================================================

/**
 * Save a transaction with optional learning from raw SMS.
 * Performs validation, persistence, and template/keyword learning.
 * 
 * @param transaction - Transaction to save
 * @param options - Save configuration including callbacks
 * 
 * @side-effects
 * - Persists transaction to storage
 * - Updates template bank (if smart-paste)
 * - Updates keyword bank (if smart-paste)
 * - Stores vendor/account remappings (if user corrected)
 * - Shows toast notifications
 */
export function saveTransactionWithLearning(
  transaction: Transaction,
  options: SaveOptions
) {
  const {
    rawMessage,
    isNew,
    senderHint,
    addTransaction,
    updateTransaction,
    learnFromTransaction,
    navigateBack,
    silent = false,
    showPatternToast = true,
    combineToasts = false,
  } = options;

  // Validate before any persistence
  if (!validateTransactionInput(transaction)) {
    return;
  }

  const newTransaction: Transaction = {
    ...transaction,
    id: transaction.id || uuidv4(),
    source: transaction.source || 'manual'
  };

  // Persist transaction
  if (isNew) {
    addTransaction(newTransaction);
  } else {
    updateTransaction(newTransaction);
  }

  storeTransaction(newTransaction);

  // ============================================================================
  // SECTION: Smart Paste Learning
  // PURPOSE: Extract patterns from confirmed transactions
  // REVIEW: Only runs for smart-paste source with raw message
  // ============================================================================

  if (rawMessage && newTransaction.source === 'smart-paste') {
    learnFromTransaction(rawMessage, newTransaction, senderHint || '');

    // Extract and save template structure
    const { structure, placeholders, hash: templateHash } = extractTemplateStructure(rawMessage);
    const fields = Object.keys(placeholders);

    const key = getTemplateKey(senderHint, newTransaction.fromAccount, templateHash);
    const bank = loadTemplateBank();
    if (!bank[key]) {
      saveNewTemplate(structure, fields, rawMessage, senderHint, newTransaction.fromAccount);
    }

    if (!silent && showPatternToast && !combineToasts) {
      toast({
        title: 'Pattern saved for learning',
        description: 'Future similar messages will be recognized automatically',
      });
    }

    // ============================================================================
    // SECTION: Keyword Bank Update
    // PURPOSE: Map vendor keywords to category for future inference
    // REVIEW: Avoid duplicate mappings in existing entries
    // ============================================================================

    const keyword = placeholders?.vendor?.toLowerCase() || newTransaction.vendor.toLowerCase();
    const keywordBank = loadKeywordBank();
    const existing = keywordBank.find(k => k.keyword === keyword);

    const newMappings: KeywordEntry['mappings'] = [
      { field: 'category', value: newTransaction.category },
      { field: 'subcategory', value: newTransaction.subcategory || 'none' },
    ];

    if (existing) {
      newMappings.forEach(mapping => {
        const alreadyMapped = existing.mappings.some(m => m.field === mapping.field);
        if (!alreadyMapped) existing.mappings.push(mapping);
      });
    } else {
      keywordBank.push({ keyword, type: 'auto', mappings: newMappings });
    }
    saveKeywordBank(keywordBank);

    // ============================================================================
    // SECTION: Remapping Storage
    // PURPOSE: Store user corrections for vendor/account names
    // REVIEW: Only stores if user changed the value
    // ============================================================================

    // Vendor Remapping - user corrected vendor name
    if (
      rawMessage &&
      transaction.vendor &&
      placeholders?.vendor &&
      transaction.vendor !== placeholders.vendor
    ) {
      const vendorMap = JSON.parse(safeStorage.getItem('xpensia_vendor_map') || '{}');
      vendorMap[placeholders.vendor] = transaction.vendor;
      safeStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
    }

    // FromAccount Remapping - user corrected account name
    if (
      rawMessage &&
      transaction.fromAccount &&
      placeholders?.account &&
      transaction.fromAccount !== placeholders.account
    ) {
      const fromAccountMap = JSON.parse(safeStorage.getItem('xpensia_fromaccount_map') || '{}');
      fromAccountMap[placeholders.account] = transaction.fromAccount;
      safeStorage.setItem('xpensia_fromaccount_map', JSON.stringify(fromAccountMap));
    }

    // Default From Account Mapping - store for template defaults
    if (templateHash && newTransaction.fromAccount) {
      const templates = loadTemplateBank();
      const key = getTemplateKey(senderHint, newTransaction.fromAccount, templateHash);
      const target = templates[key] || templates[getTemplateKey(senderHint, undefined, templateHash)];
      if (target && !target.defaultValues?.fromAccount) {
        target.defaultValues = {
          ...target.defaultValues,
          fromAccount: newTransaction.fromAccount,
        };
        saveTemplateBank(templates);
      }
    }
  }

  // ============================================================================
  // SECTION: Toast Notifications
  // PURPOSE: Provide user feedback on save
  // REVIEW: Combine mode reduces notification noise
  // ============================================================================

  if (!silent) {
    if (combineToasts) {
      let description = `Your transaction has been successfully ${isNew ? 'created' : 'updated'}.`;
      if (rawMessage && newTransaction.source === 'smart-paste' && showPatternToast) {
        description += ' Pattern saved for learning.';
      }
      toast({
        title: isNew ? 'Transaction created' : 'Transaction updated',
        description,
      });
    } else {
      toast({
        title: isNew ? 'Transaction created' : 'Transaction updated',
        description: `Your transaction has been successfully ${isNew ? 'created' : 'updated'}`,
      });
    }
  }

  navigateBack();
}
