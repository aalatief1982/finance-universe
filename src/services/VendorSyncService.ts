import { safeStorage } from '@/utils/safe-storage';
import {
  saveVendorFallbacks,
  loadVendorFallbacks,
  type VendorFallbackData,
} from '@/lib/smart-paste-engine/vendorFallbackUtils';

const VENDOR_SOURCE_KEY = 'xpensia_vendor_source';
const REGISTRY_FILE_ID = '1J5mCbNoYeJd-KE_dz15W2c40L53r0K2A';
const REGISTRY_URL = `https://drive.google.com/uc?export=download&id=${REGISTRY_FILE_ID}`;

// Callback type for sync completion notifications
type SyncCompletionCallback = (success: boolean, updatedData?: VendorData) => void;
const syncCallbacks: SyncCompletionCallback[] = [];

interface VendorData {
  [key: string]: {
    type: string;
    category: string;
    subcategory: string;
  };
}

interface VendorRegistry {
  latest: {
    filename: string;
    version: string;
    fileId: string;
  };
  history?: {
    filename: string;
    version: string;
    fileId: string;
  }[];
}

function getStoredDocumentName(): string | null {
  return safeStorage.getItem(VENDOR_SOURCE_KEY);
}

/**
 * Check if internet connection is available
 */
async function hasInternetConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return true;
  } catch {
    return navigator.onLine;
  }
}

/**
 * Fetch the vendor registry metadata from Google Drive
 */
async function fetchVendorRegistry(): Promise<VendorRegistry | null> {
  try {
    const response = await fetch(REGISTRY_URL, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn('[VendorSync] Cannot fetch registry file:', response.status);
      return null;
    }

    const registry = await response.json();
    if (registry?.latest?.fileId && registry?.latest?.filename) {
      return registry as VendorRegistry;
    }

    console.warn('[VendorSync] Registry file is malformed');
    return null;
  } catch (error) {
    console.error('[VendorSync] Error fetching registry:', error);
    return null;
  }
}

/**
 * Fetch vendor data from a specific fileId
 */
async function fetchVendorDataFromDrive(fileId: string): Promise<VendorData | null> {
  try {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn('[VendorSync] Cannot fetch vendor data file:', response.status);
      return null;
    }

    const jsonData = await response.json();

    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData as VendorData;
    }

    console.warn('[VendorSync] Invalid vendor data structure');
    return null;
  } catch (error) {
    console.error('[VendorSync] Error fetching vendor data:', error);
    return null;
  }
}

/**
 * Replace fallback data with new vendor mappings
 */
function replaceVendorDataToFallbacks(vendorData: VendorData): void {
  try {
    const existingFallbacks = loadVendorFallbacks();

    const userVendors: Record<string, VendorFallbackData> = {};
    Object.entries(existingFallbacks).forEach(([vendorName, vendorInfo]) => {
      if (vendorInfo.user) {
        userVendors[vendorName] = vendorInfo;
      }
    });

    const newFallbacks = { ...userVendors };

    Object.entries(vendorData).forEach(([vendorName, vendorInfo]) => {
      if (!userVendors[vendorName]) {
        newFallbacks[vendorName] = {
          type: vendorInfo.type as 'expense' | 'income' | 'transfer',
          category: vendorInfo.category,
          subcategory: vendorInfo.subcategory,
        };
      }
    });

    saveVendorFallbacks(newFallbacks);

    if (import.meta.env.MODE === 'development') {
      console.log(
        `[VendorSync] Fallbacks replaced: preserved ${Object.keys(userVendors).length} user vendors, added ${Object.keys(vendorData).length} new.`
      );
    }
  } catch (error) {
    console.error('[VendorSync] Error replacing fallbacks:', error);
  }
}

/**
 * Sync vendor data if the filename from registry differs
 */
export async function checkForVendorUpdates(): Promise<boolean> {
  try {
    const hasInternet = await hasInternetConnection();
    if (!hasInternet) {
      console.log('[VendorSync] Offline – skipping update');
      return false;
    }

    const registry = await fetchVendorRegistry();
    if (!registry) return false;

    const { filename, fileId } = registry.latest;
    const storedFilename = getStoredDocumentName();

    if (storedFilename !== filename) {
      console.log(`[VendorSync] New vendor file detected: ${storedFilename} → ${filename}`);
      const vendorData = await fetchVendorDataFromDrive(fileId);
      if (vendorData) {
        replaceVendorDataToFallbacks(vendorData);
        safeStorage.setItem(VENDOR_SOURCE_KEY, filename);
        syncCallbacks.forEach((cb) => cb(true, vendorData));
        return true;
      } else {
        syncCallbacks.forEach((cb) => cb(false));
      }
    } else {
      console.log('[VendorSync] Vendor file unchanged – no sync needed');
    }

    return false;
  } catch (error) {
    console.error('[VendorSync] Sync error:', error);
    syncCallbacks.forEach((cb) => cb(false));
    return false;
  }
}

/**
 * Refresh from current fileId (manual use)
 */
export function refreshVendorFallbacks(): void {
  fetchVendorRegistry().then((registry) => {
    if (registry?.latest?.fileId) {
      fetchVendorDataFromDrive(registry.latest.fileId).then((data) => {
        if (data) {
          replaceVendorDataToFallbacks(data);
          console.log('[VendorSync] Fallbacks refreshed manually.');
        }
      });
    }
  });
}

/**
 * Register a callback to listen for sync result
 */
export function onSyncComplete(callback: SyncCompletionCallback): () => void {
  syncCallbacks.push(callback);
  return () => {
    const index = syncCallbacks.indexOf(callback);
    if (index > -1) syncCallbacks.splice(index, 1);
  };
}

export function getVendorData(): VendorData | null {
  try {
    return loadVendorFallbacks();
  } catch (error) {
    console.error('[VendorSync] Error loading vendor data:', error);
    return null;
  }
}

