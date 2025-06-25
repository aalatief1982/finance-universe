export interface VendorFallbackData {
  type: 'expense' | 'income' | 'transfer';
  category: string;
  subcategory: string;
  /** Indicates entry was added by the user */
  user?: boolean;
}

const KEY = 'xpensia_vendor_fallbacks';

function canUseFs(): boolean {
  return (
    typeof window === 'undefined' &&
    typeof process !== 'undefined' &&
    !!process.versions?.node
  );
}

function getVendorFilePath() {
  const req = eval('require');
  const { fileURLToPath } = req('url');
  const path = req('path');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../../data/ksa_all_vendors_clean_final.json');
}

export function loadVendorFallbacks(): Record<string, VendorFallbackData> {
  if (canUseFs()) {
    try {
      const req = eval('require');
      const fs = req('fs') as typeof import('fs');
      const raw = fs.readFileSync(getVendorFilePath(), 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, VendorFallbackData>;
      const entries = Object.entries(parsed).filter(([k]) => k.trim());
      const sanitized = Object.fromEntries(entries) as Record<string, VendorFallbackData>;
      if (entries.length !== Object.entries(parsed).length) {
        try {
          saveVendorFallbacks(sanitized);
        } catch {
          // ignore
        }
      }
      return sanitized;
    } catch (e) {
      console.error('[VendorFallbackUtils] Failed to load vendor file:', e);
      return {};
    }
  }

  const raw = localStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, VendorFallbackData>;
    const entries = Object.entries(parsed).filter(([k]) => k.trim());
    const sanitized = Object.fromEntries(entries) as Record<string, VendorFallbackData>;

    if (entries.length !== Object.entries(parsed).length) {
      try {
        saveVendorFallbacks(sanitized);
      } catch {
        // ignore persistence errors
      }
    }

    return sanitized;
  } catch (e) {
    console.error('[VendorFallbackUtils] Failed to parse stored vendor data:', e);
    return {};
  }
}

export function saveVendorFallbacks(data: Record<string, VendorFallbackData>): void {
  if (canUseFs()) {
    try {
      const req = eval('require');
      const fs = req('fs') as typeof import('fs');
      fs.writeFileSync(getVendorFilePath(), JSON.stringify(data, null, 2), 'utf-8');
      return;
    } catch (e) {
      console.error('[VendorFallbackUtils] Failed to save vendor file:', e);
    }
  }

  localStorage.setItem(KEY, JSON.stringify(data));
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
