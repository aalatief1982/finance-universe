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

import { safeStorage } from '@/utils/safe-storage';
import { Transaction } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import {
  extractTemplateStructure,
  saveNewTemplate,
  loadTemplateBank,
  saveTemplateBank,
  getTemplateKey,
  getTemplateByHash,
} from './templateUtils';
import {
  loadKeywordBank,
  saveKeywordBank,
  KeywordEntry,
} from './keywordBankUtils';
import {
  addUserVendor,
  findVendorByNormalizedName,
  isVendorNameValid,
  normalizeVendorNameForCompare,
  sanitizeVendorName,
  loadVendorFallbacks,
} from './vendorFallbackUtils';
import { getVendorData } from '@/services/VendorSyncService';
import { toast } from '@/components/ui/use-toast';
import { accountService } from '@/services/AccountService';
import { getUserSettings } from '@/utils/storage-utils';
import { ensureFxFields } from '@/services/FxConversionService';
import {
  TransactionValidationError,
  validateTransaction,
} from '@/lib/transaction-validation';
import { normalizeDraftTransactionForSave } from '@/lib/transactions/normalizeDraftTransactionForSave';
import { recordPreferredFromAccount } from './templateHashAccountMap';

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

type TemplateAccountMapEntry = {
  accountId: string;
  updatedAt: number;
  count: number;
};

type TemplateAccountMap = Record<string, TemplateAccountMapEntry>;

const TEMPLATE_ACCOUNT_MAP_KEY = 'xpensia_template_account_map';

const loadTemplateAccountMap = (): TemplateAccountMap => {
  try {
    return JSON.parse(safeStorage.getItem(TEMPLATE_ACCOUNT_MAP_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveTemplateAccountMap = (map: TemplateAccountMap): void => {
  safeStorage.setItem(TEMPLATE_ACCOUNT_MAP_KEY, JSON.stringify(map));
};

const getTemplateAccountMapKey = (
  templateHash: string,
  role: 'from' | 'to',
): string => `${templateHash}::${role}`;

const upsertTemplateAccountPreference = (
  templateHash: string,
  role: 'from' | 'to',
  accountId?: string,
): void => {
  const normalizedAccount = accountId?.trim();
  if (!templateHash || !normalizedAccount) {
    return;
  }

  const map = loadTemplateAccountMap();
  const key = getTemplateAccountMapKey(templateHash, role);
  const existing = map[key];

  map[key] = {
    accountId: normalizedAccount,
    updatedAt: Date.now(),
    count: (existing?.count || 0) + 1,
  };

  saveTemplateAccountMap(map);
};


const ACCOUNT_PLACEHOLDER_VALUES = new Set(['', 'select account', 'unknown', 'n/a', 'none']);

const normalizeAccountNameForCompare = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const ensureAccountExistsForTransaction = (accountValue?: string): string | undefined => {
  if (typeof accountValue !== 'string') {
    return accountValue;
  }

  const trimmedValue = accountValue.trim();
  if (!trimmedValue) {
    return accountValue;
  }

  const accountById = accountService.getAccountById(trimmedValue);
  if (accountById) {
    return accountById.id;
  }

  const normalizedInput = normalizeAccountNameForCompare(trimmedValue);
  if (ACCOUNT_PLACEHOLDER_VALUES.has(normalizedInput)) {
    return trimmedValue;
  }

  const existingAccount = accountService
    .getAccounts()
    .find((account) => normalizeAccountNameForCompare(account.name) === normalizedInput);

  if (existingAccount) {
    return existingAccount.name;
  }

  const settingsCurrency = getUserSettings()?.currency;
  const newAccount = accountService.addAccount({
    id: uuidv4(),
    name: trimmedValue,
    type: 'Bank',
    currency: settingsCurrency || 'SAR',
    initialBalance: 0,
    startDate: new Date().toISOString().split('T')[0],
    tags: [],
  });

  return newAccount.name;
};

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
  options: SaveOptions,
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

  const normalizedForSave = normalizeDraftTransactionForSave(transaction);

  const errors = validateTransaction(normalizedForSave, normalizedForSave.type);
  if (Object.keys(errors).length > 0) {
    throw new TransactionValidationError(errors);
  }

  const transactionWithAccounts: Transaction = {
    ...normalizedForSave,
    fromAccount: ensureAccountExistsForTransaction(normalizedForSave.fromAccount),
    toAccount: ensureAccountExistsForTransaction(normalizedForSave.toAccount),
  };

  const sanitizedVendor = sanitizeVendorName(transactionWithAccounts.vendor || '');
  const knownVendorNames = [
    ...Object.keys(getVendorData() || {}),
    ...Object.keys(loadVendorFallbacks()),
  ];
  const existingVendorName = findVendorByNormalizedName(
    knownVendorNames,
    sanitizedVendor,
  );
  const effectiveVendorName = existingVendorName || sanitizedVendor;

  if (!existingVendorName && isVendorNameValid(sanitizedVendor)) {
    addUserVendor(sanitizedVendor, {
      type: transactionWithAccounts.type,
      category: transactionWithAccounts.category,
      subcategory: transactionWithAccounts.subcategory || 'none',
    });
  }

  const newTransaction: Transaction = ensureFxFields({
    ...transactionWithAccounts,
    vendor: effectiveVendorName,
    id: normalizedForSave.id || uuidv4(),
    source: normalizedForSave.source || 'manual',
  });

  // Persist transaction
  if (isNew) {
    addTransaction(newTransaction);
  } else {
    updateTransaction(newTransaction);
  }

  // ============================================================================
  // SECTION: Smart Paste Learning
  // PURPOSE: Extract patterns from confirmed transactions
  // REVIEW: Only runs for smart-paste source with raw message
  // ============================================================================

  const isLearningSource = ['smart-paste', 'sms', 'sms-import'].includes(
    newTransaction.source,
  );

  if (rawMessage && isLearningSource) {
    learnFromTransaction(rawMessage, newTransaction, senderHint || '');

    // Extract and save template structure
    const {
      structure,
      placeholders,
      hash: templateHash,
    } = extractTemplateStructure(rawMessage);
    const fields = Object.keys(placeholders);

    const existingTemplate = getTemplateByHash(
      templateHash,
      senderHint,
      newTransaction.fromAccount,
    );
    if (!existingTemplate) {
      saveNewTemplate(
        structure,
        fields,
        rawMessage,
        senderHint,
        newTransaction.fromAccount,
      );
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

    const keyword =
      placeholders?.vendor?.toLowerCase() ||
      newTransaction.vendor.toLowerCase();
    const keywordBank = loadKeywordBank();
    const existing = keywordBank.find((k) => k.keyword === keyword);

    const newMappings: KeywordEntry['mappings'] = [
      { field: 'category', value: newTransaction.category },
      { field: 'subcategory', value: newTransaction.subcategory || 'none' },
    ];

    if (existing) {
      newMappings.forEach((mapping) => {
        const alreadyMapped = existing.mappings.some(
          (m) => m.field === mapping.field,
        );
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
    const rawDetectedVendorToken =
      typeof transactionWithAccounts.details?.detectedVendorToken === 'string'
        ? transactionWithAccounts.details.detectedVendorToken
        : placeholders?.vendor;

    const normalizedDetectedToken = normalizeVendorNameForCompare(
      rawDetectedVendorToken || '',
    );
    const normalizedConfirmedVendor = normalizeVendorNameForCompare(
      newTransaction.vendor || '',
    );

    if (
      normalizedDetectedToken &&
      isVendorNameValid(newTransaction.vendor || '') &&
      normalizedDetectedToken !== normalizedConfirmedVendor
    ) {
      const vendorMap = JSON.parse(
        safeStorage.getItem('xpensia_vendor_map') || '{}',
      );
      vendorMap[normalizedDetectedToken] = newTransaction.vendor;
      safeStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
    }

    // FromAccount Remapping - user corrected account name
    if (
      rawMessage &&
      transactionWithAccounts.fromAccount &&
      placeholders?.account &&
      transactionWithAccounts.fromAccount !== placeholders.account
    ) {
      const fromAccountMap = JSON.parse(
        safeStorage.getItem('xpensia_fromaccount_map') || '{}',
      );
      fromAccountMap[placeholders.account] = transactionWithAccounts.fromAccount;
      safeStorage.setItem(
        'xpensia_fromaccount_map',
        JSON.stringify(fromAccountMap),
      );
    }

    // Preferred account by template hash (source-agnostic, post-confirm only)
    if (templateHash) {
      if (newTransaction.type === 'income') {
        upsertTemplateAccountPreference(templateHash, 'to', newTransaction.toAccount);
      } else if (newTransaction.type === 'transfer') {
        upsertTemplateAccountPreference(templateHash, 'from', newTransaction.fromAccount);
        upsertTemplateAccountPreference(templateHash, 'to', newTransaction.toAccount);
      } else {
        upsertTemplateAccountPreference(templateHash, 'from', newTransaction.fromAccount);
      }

      recordPreferredFromAccount(
        senderHint,
        templateHash,
        newTransaction.fromAccount,
      );
    }

    // Default From Account Mapping - store for template defaults
    if (templateHash && newTransaction.fromAccount) {
      const templates = loadTemplateBank();
      const key = getTemplateKey(
        senderHint,
        newTransaction.fromAccount,
        templateHash,
      );
      const target =
        templates[key] ||
        templates[getTemplateKey(senderHint, undefined, templateHash)];
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
      if (
        rawMessage && isLearningSource && showPatternToast
      ) {
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
