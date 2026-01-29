import { Transaction } from '@/types/transaction';
import { loadVendorFallbacks, saveVendorFallbacks, VendorFallbackData } from './vendorFallbackUtils';
import { loadKeywordBank, saveKeywordBank, KeywordEntry } from './keywordBankUtils';

export interface LearningResult {
  vendorsLearned: number;
  keywordsLearned: number;
  conflicts: string[];
}

interface VendorClassification {
  vendor: string;
  type: 'expense' | 'income' | 'transfer';
  category: string;
  subcategory?: string;
  count: number;
}

export function batchLearnFromTransactions(transactions: Transaction[]): LearningResult {
  const result: LearningResult = {
    vendorsLearned: 0,
    keywordsLearned: 0,
    conflicts: [],
  };
  if (!transactions || transactions.length === 0) return result;
  const vendorGroups = groupByVendor(transactions);
  const classifications = computeDominantClassifications(vendorGroups);
  result.vendorsLearned = updateVendorFallbacks(classifications, result.conflicts);
  result.keywordsLearned = updateKeywordBank(classifications);
  console.info('[CSV Learning] Learned from import:', result);
  return result;
}

function groupByVendor(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const key = normalizeVendorKey(txn.vendor || txn.title);
    if (!key) continue;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(txn);
  }
  return groups;
}

function normalizeVendorKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '')
    .slice(0, 50);
}

function computeDominantClassifications(
  groups: Map<string, Transaction[]>
): VendorClassification[] {
  const classifications: VendorClassification[] = [];
  for (const [vendor, txns] of groups) {
    if (txns.length < 2) continue;
    const comboCounts = new Map<string, { count: number; data: VendorClassification }>();
    for (const txn of txns) {
      const comboKey = `${txn.type}|${txn.category}|${txn.subcategory || ''}`;
      if (!comboCounts.has(comboKey)) {
        comboCounts.set(comboKey, {
          count: 0,
          data: {
            vendor,
            type: txn.type as 'expense' | 'income' | 'transfer',
            category: txn.category,
            subcategory: txn.subcategory,
            count: 0,
          }
        });
      }
      comboCounts.get(comboKey)!.count++;
    }
    let dominant: VendorClassification | null = null;
    let maxCount = 0;
    for (const { count, data } of comboCounts.values()) {
      if (count > maxCount) {
        maxCount = count;
        dominant = { ...data, count };
      }
    }
    if (dominant) {
      classifications.push(dominant);
    }
  }
  return classifications;
}

function updateVendorFallbacks(
  classifications: VendorClassification[],
  conflicts: string[]
): number {
  const vendors = loadVendorFallbacks();
  let learned = 0;
  for (const cls of classifications) {
    const existing = vendors[cls.vendor];
    const confidence = cls.count >= 5 ? 0.9 : cls.count >= 3 ? 0.7 : 0.5;
    if (existing) {
      if (existing.user) {
        conflicts.push(`${cls.vendor}: kept user-defined mapping`);
        continue;
      }
      if (existing.confidence && existing.confidence >= confidence) {
        conflicts.push(`${cls.vendor}: kept existing higher-confidence mapping`);
        continue;
      }
    }
    vendors[cls.vendor] = {
      type: cls.type,
      category: cls.category,
      subcategory: cls.subcategory || '',
      source: 'csv-import',
      learnedAt: new Date().toISOString(),
      confidence,
      sampleCount: cls.count,
    };
    learned++;
  }
  saveVendorFallbacks(vendors);
  return learned;
}

function updateKeywordBank(classifications: VendorClassification[]): number {
  const keywordBank = loadKeywordBank();
  let learned = 0;
  for (const cls of classifications) {
    const keyword = cls.vendor.toLowerCase();
    const existing = keywordBank.find(k => k.keyword === keyword);
    const newMappings: KeywordEntry['mappings'] = [
      { field: 'category', value: cls.category },
    ];
    if (cls.subcategory) {
      newMappings.push({ field: 'subcategory', value: cls.subcategory });
    }
    if (existing) {
      for (const mapping of newMappings) {
        const alreadyMapped = existing.mappings.some(m => m.field === mapping.field);
        if (!alreadyMapped) {
          existing.mappings.push(mapping);
          learned++;
        }
      }
      existing.lastUpdated = new Date().toISOString();
      existing.mappingCount = (existing.mappingCount || 0) + cls.count;
    } else {
      keywordBank.push({
        keyword,
        type: 'csv-import',
        mappings: newMappings,
        lastUpdated: new Date().toISOString(),
        mappingCount: cls.count,
        source: 'csv-import',
      });
      learned++;
    }
  }
  saveKeywordBank(keywordBank);
  return learned;
}

export function getCsvLearnedVendors(): Array<{ vendor: string; data: VendorFallbackData }> {
  const vendors = loadVendorFallbacks();
  return Object.entries(vendors)
    .filter(([_, data]) => data.source === 'csv-import')
    .map(([vendor, data]) => ({ vendor, data }));
}
