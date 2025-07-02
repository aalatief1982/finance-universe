import { Transaction } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { extractTemplateStructure, saveNewTemplate, loadTemplateBank, saveTemplateBank, getTemplateKey } from './templateUtils';
import { loadKeywordBank, saveKeywordBank } from './keywordBankUtils';
import { storeTransaction } from '@/utils/storage-utils';
import { toast } from '@/components/ui/use-toast';

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

  const newTransaction: Transaction = {
    ...transaction,
    id: transaction.id || uuidv4(),
    source: transaction.source || 'manual'
  };

  if (isNew) {
    addTransaction(newTransaction);
  } else {
    updateTransaction(newTransaction);
  }

  storeTransaction(newTransaction);

  if (rawMessage && newTransaction.source === 'smart-paste') {
    learnFromTransaction(rawMessage, newTransaction, senderHint || '');

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

    // Keyword Bank Mapping
    const keyword = placeholders?.vendor?.toLowerCase() || newTransaction.vendor.toLowerCase();
    const keywordBank = loadKeywordBank();
    const existing = keywordBank.find(k => k.keyword === keyword);

    const newMappings = [
      { field: 'category', value: newTransaction.category },
      { field: 'subcategory', value: newTransaction.subcategory || 'none' },
    ];

    if (existing) {
      newMappings.forEach(mapping => {
        const alreadyMapped = existing.mappings.some(m => m.field === mapping.field);
        if (!alreadyMapped) existing.mappings.push(mapping);
      });
    } else {
      keywordBank.push({ keyword, mappings: newMappings });
    }
    saveKeywordBank(keywordBank);

    // Vendor Remapping
    if (
      rawMessage &&
      transaction.vendor &&
      placeholders?.vendor &&
      transaction.vendor !== placeholders.vendor
    ) {
      const vendorMap = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
      vendorMap[placeholders.vendor] = transaction.vendor;
      localStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
    }

    // Default From Account Mapping
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
