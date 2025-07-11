import { safeStorage } from "@/utils/safe-storage";
export interface VendorFallbackData {
  type: 'expense' | 'income' | 'transfer';
  category: string;
  subcategory: string;
  /** Indicates entry was added by the user */
  user?: boolean;
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

export { KEY as VENDOR_FALLBACK_KEY };
