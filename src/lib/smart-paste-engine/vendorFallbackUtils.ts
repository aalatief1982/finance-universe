export interface VendorFallbackData {
  type: 'expense' | 'income' | 'transfer';
  category: string;
  subcategory: string;
}

const KEY = 'xpensia_vendor_fallbacks';

export function loadVendorFallbacks(): Record<string, VendorFallbackData> {
  const raw = localStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, VendorFallbackData>;
  } catch (e) {
    console.error('[VendorFallbackUtils] Failed to parse stored vendor data:', e);
    return {};
  }
}

export function saveVendorFallbacks(data: Record<string, VendorFallbackData>): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export { KEY as VENDOR_FALLBACK_KEY };
