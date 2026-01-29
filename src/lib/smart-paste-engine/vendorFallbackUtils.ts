import { safeStorage } from "@/utils/safe-storage";
export interface VendorFallbackData {
  type: 'expense' | 'income' | 'transfer';
  category: string;
  subcategory: string;
  /** Indicates entry was added by the user */
  user?: boolean;
  source?: 'manual' | 'sms-learn' | 'csv-import';
  learnedAt?: string;
  confidence?: number;    // 0-1 based on consistency
  sampleCount?: number;   // Number of transactions that informed this
}

const KEY = 'xpensia_vendor_fallbacks';

export function loadVendorFallbacks(): Record<string, VendorFallbackData> {
  const raw = safeStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, VendorFallbackData>;
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorFallbackUtils] Failed to parse stored vendor data:', e);
    }
    return {};
  }
}

export function saveVendorFallbacks(data: Record<string, VendorFallbackData>): void {
  safeStorage.setItem(KEY, JSON.stringify(data));
}

export function getVendorNames(): string[] {
  return Object.keys(loadVendorFallbacks());
}

export function addUserVendor(
  name: string,
  data: Omit<VendorFallbackData, 'user'>,
  user: boolean = true
): void {
  if (!name.trim()) return;
  const vendors = loadVendorFallbacks();
  if (!vendors[name]) {
    vendors[name] = { ...data, ...(user ? { user: true } : {}) } as VendorFallbackData;
    saveVendorFallbacks(vendors);
  }
}

export function addLearnedVendor(
  name: string,
  data: Omit<VendorFallbackData, 'learnedAt'>,
  source: 'manual' | 'sms-learn' | 'csv-import' = 'manual'
): void {
  if (!name.trim()) return;
  const vendors = loadVendorFallbacks();
  const existing = vendors[name];
  if (existing) {
    if (existing.user) return; // Never overwrite user-added
    if (existing.confidence && data.confidence && existing.confidence > data.confidence) return;
  }
  vendors[name] = {
    ...data,
    source,
    learnedAt: new Date().toISOString(),
  };
  saveVendorFallbacks(vendors);
}

export { KEY as VENDOR_FALLBACK_KEY };
