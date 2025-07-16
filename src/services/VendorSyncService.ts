import { safeStorage } from '@/utils/safe-storage';
import { saveVendorFallbacks, loadVendorFallbacks, type VendorFallbackData } from '@/lib/smart-paste-engine/vendorFallbackUtils';

const VENDOR_SOURCE_KEY = 'xpensia_vendor_source';
const VENDOR_VERSION_KEY = 'xpensia_vendor_version';
const DOCUMENT_NAME = 'xpensia_vendor_mapping_v1.0';
const GOOGLE_DRIVE_FILE_ID = '1QD_3mysr8gxMB_HQ88ZYI9ip7HSnosd-';
const GOOGLE_DRIVE_URL = `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FILE_ID}`;

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

/**
 * Initialize the vendor source name in localStorage
 */
export function initializeVendorSource(): void {
  const stored = safeStorage.getItem(VENDOR_SOURCE_KEY);
  if (!stored) {
    safeStorage.setItem(VENDOR_SOURCE_KEY, DOCUMENT_NAME);
    if (import.meta.env.MODE === 'development') {
      console.log('[VendorSync] Initialized vendor source:', DOCUMENT_NAME);
    }
  }
}

/**
 * Check if internet connection is available
 */
async function hasInternetConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch {
    return navigator.onLine;
  }
}

/**
 * Extract version/timestamp from JSON file to detect changes
 */
async function fetchVendorDataVersion(): Promise<string | null> {
  try {
    const response = await fetch(GOOGLE_DRIVE_URL, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[VendorSync] Cannot access Google Drive file:', response.status);
      }
      return null;
    }
    
    const jsonData = await response.json();
    // Use timestamp or version field, fallback to stringified data hash
    return jsonData.version || jsonData.timestamp || JSON.stringify(jsonData).length.toString();
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error fetching vendor data version:', error);
    }
    return null;
  }
}

/**
 * Fetch vendor data from Google Drive JSON file
 */
async function fetchVendorDataFromDrive(): Promise<VendorData | null> {
  try {
    const response = await fetch(GOOGLE_DRIVE_URL, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[VendorSync] Cannot access Google Drive file:', response.status);
      }
      return null;
    }
    
    const jsonData = await response.json();
    
    // Validate the data structure
    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData as VendorData;
    }
    
    if (import.meta.env.MODE === 'development') {
      console.warn('[VendorSync] Invalid vendor data format received from Google Drive');
    }
    return null;
    
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error fetching vendor data from Google Drive:', error);
    }
    return null;
  }
}

/**
 * Convert VendorData to VendorFallbackData format and merge with existing vendor fallbacks
 */
function mergeVendorDataToFallbacks(vendorData: VendorData): void {
  try {
    const existingFallbacks = loadVendorFallbacks();
    const newFallbacks = { ...existingFallbacks };
    
    // Convert and merge vendor data
    Object.entries(vendorData).forEach(([vendorName, vendorInfo]) => {
      // Only update if this vendor doesn't exist or is not user-added
      if (!newFallbacks[vendorName] || !newFallbacks[vendorName].user) {
        newFallbacks[vendorName] = {
          type: vendorInfo.type as 'expense' | 'income' | 'transfer',
          category: vendorInfo.category,
          subcategory: vendorInfo.subcategory
        };
      }
    });
    
    // Save the updated fallbacks
    saveVendorFallbacks(newFallbacks);
    
    if (import.meta.env.MODE === 'development') {
      console.log('[VendorSync] Successfully merged vendor data to fallbacks');
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error merging vendor data to fallbacks:', error);
    }
  }
}

/**
 * Update the local vendor data and merge with vendor fallbacks
 */
async function updateVendorDataFile(newData: VendorData, version: string): Promise<void> {
  try {
    // Store the updated data in localStorage override
    safeStorage.setItem('xpensia_vendor_data_override', JSON.stringify(newData));
    safeStorage.setItem(VENDOR_VERSION_KEY, version);
    
    // Merge the new data into vendor fallbacks
    mergeVendorDataToFallbacks(newData);
    
    // Notify all registered callbacks
    syncCallbacks.forEach(callback => {
      try {
        callback(true, newData);
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error('[VendorSync] Error in sync callback:', error);
        }
      }
    });
    
    if (import.meta.env.MODE === 'development') {
      console.log('[VendorSync] Vendor data updated and merged successfully');
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error updating vendor data:', error);
    }
    
    // Notify callbacks of failure
    syncCallbacks.forEach(callback => {
      try {
        callback(false);
      } catch (callbackError) {
        if (import.meta.env.MODE === 'development') {
          console.error('[VendorSync] Error in sync failure callback:', callbackError);
        }
      }
    });
  }
}

/**
 * Check for vendor mapping updates and sync if needed
 */
export async function checkForVendorUpdates(): Promise<boolean> {
  try {
    // Initialize if not exists
    initializeVendorSource();
    
    // Check internet connection
    const hasInternet = await hasInternetConnection();
    if (!hasInternet) {
      if (import.meta.env.MODE === 'development') {
        console.log('[VendorSync] No internet connection, skipping update check');
      }
      return false;
    }
    
    // Get stored version
    const storedVersion = safeStorage.getItem(VENDOR_VERSION_KEY);
    
    // Fetch current version
    const currentVersion = await fetchVendorDataVersion();
    
    if (!currentVersion) {
      if (import.meta.env.MODE === 'development') {
        console.log('[VendorSync] Could not fetch vendor data version');
      }
      return false;
    }
    
    // Check if version has changed or no stored version exists
    if (storedVersion !== currentVersion) {
      if (import.meta.env.MODE === 'development') {
        console.log('[VendorSync] Vendor data version changed:', storedVersion, '->', currentVersion);
      }
      
      // Fetch and update vendor data
      const newVendorData = await fetchVendorDataFromDrive();
      if (newVendorData) {
        await updateVendorDataFile(newVendorData, currentVersion);
        if (import.meta.env.MODE === 'development') {
          console.log('[VendorSync] Vendor data successfully synced from Google Drive');
        }
        return true;
      } else {
        if (import.meta.env.MODE === 'development') {
          console.warn('[VendorSync] Could not fetch vendor data from Google Drive');
        }
        // Notify callbacks of failure
        syncCallbacks.forEach(callback => {
          try {
            callback(false);
          } catch (error) {
            if (import.meta.env.MODE === 'development') {
              console.error('[VendorSync] Error in sync failure callback:', error);
            }
          }
        });
      }
    }
    
    return false;
    
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error checking for updates:', error);
    }
    
    // Notify callbacks of error
    syncCallbacks.forEach(callback => {
      try {
        callback(false);
      } catch (callbackError) {
        if (import.meta.env.MODE === 'development') {
          console.error('[VendorSync] Error in sync error callback:', callbackError);
        }
      }
    });
    
    return false;
  }
}

/**
 * Get vendor data from local storage override or fallback to imported data
 */
export function getVendorData(): VendorData | null {
  try {
    // First check if we have updated data in localStorage
    const override = safeStorage.getItem('xpensia_vendor_data_override');
    if (override) {
      return JSON.parse(override);
    }
    
    // If no override, the calling code should use the imported JSON file
    return null;
    
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error getting vendor data:', error);
    }
    return null;
  }
}

/**
 * Register a callback to be notified when vendor sync completes
 */
export function onSyncComplete(callback: SyncCompletionCallback): () => void {
  syncCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = syncCallbacks.indexOf(callback);
    if (index > -1) {
      syncCallbacks.splice(index, 1);
    }
  };
}

/**
 * Force a vendor fallback refresh from current data
 */
export function refreshVendorFallbacks(): void {
  try {
    const vendorData = getVendorData();
    if (vendorData) {
      mergeVendorDataToFallbacks(vendorData);
      if (import.meta.env.MODE === 'development') {
        console.log('[VendorSync] Vendor fallbacks refreshed from current data');
      }
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error refreshing vendor fallbacks:', error);
    }
  }
}