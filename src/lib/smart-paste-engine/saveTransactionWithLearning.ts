import { Transaction } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { extractTemplateStructure, getAllTemplates, saveNewTemplate, loadTemplateBank, saveTemplateBank } from './templateUtils';
import { loadKeywordBank, saveKeywordBank } from './keywordBankUtils';
import { storeTransaction } from '@/utils/storage-utils';
import { toast } from '@/components/ui/use-toast';
import { applyVendorMapping } from './structureParser';

interface SaveOptions {
  rawMessage?: string;
  isNew: boolean;
  senderHint?: string;
  addTransaction: (txn: Transaction) => void;
  updateTransaction: (txn: Transaction) => void;
  learnFromTransaction: (msg: string, txn: Transaction, hint: string) => void;
  navigateBack: () => void;
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
  } = options;

  const newTransaction: Transaction = {
    ...transaction,
    id: transaction.id || uuidv4(),
    source: transaction.source || 'manual',
    vendor: applyVendorMapping(transaction.vendor)
  };

  if (isNew) {
    addTransaction(newTransaction);
  } else {
    updateTransaction(newTransaction);
  }

  storeTransaction(newTransaction);

  if (rawMessage && newTransaction.source === 'smart-paste') {
    learnFromTransaction(rawMessage, newTransaction, senderHint || '');

    const { template, placeholders } = extractTemplateStructure(rawMessage);
    const fields = Object.keys(placeholders);
    const templateHash = btoa(unescape(encodeURIComponent(template))).slice(0, 24);

    const existingTemplates = getAllTemplates();
    const alreadyExists = existingTemplates.some(t => t.id === templateHash);
    if (!alreadyExists) {
      saveNewTemplate(template, fields, rawMessage);
    }

    toast({
      title: 'Pattern saved for learning',
      description: 'Future similar messages will be recognized automatically',
    });

    // Keyword Bank Mapping
    const keyword = applyVendorMapping(
      placeholders?.vendor || newTransaction.vendor
    ).toLowerCase();
    const bank = loadKeywordBank();
    const existing = bank.find(k => k.keyword === keyword);

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
      bank.push({ keyword, mappings: newMappings });
    }
    saveKeywordBank(bank);

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
      const targetTemplate = templates.find(t => t.id === templateHash);
      if (targetTemplate && !targetTemplate.defaultValues?.fromAccount) {
        targetTemplate.defaultValues = {
          ...targetTemplate.defaultValues,
          fromAccount: newTransaction.fromAccount,
        };
        saveTemplateBank(templates);
      }
    }
  }

  toast({
    title: isNew ? 'Transaction created' : 'Transaction updated',
    description: `Your transaction has been successfully ${isNew ? 'created' : 'updated'}`,
  });

  navigateBack();
}
