import { safeStorage } from '@/utils/safe-storage';

const VENDOR_SOURCE_KEY = 'xpensia_vendor_source';
const DOCUMENT_NAME = 'xpensia_vendor_mapping_v1.0';
const GOOGLE_DOCS_URL = 'https://docs.google.com/document/d/1r4RKGBJWkEq_J3IiqvEbW_v_0XfAnPUzJAnPg3hZb5o/edit?usp=sharing';

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
 * Extract document name from Google Docs content
 * This is a placeholder - actual implementation would need to parse the document
 */
async function fetchDocumentName(): Promise<string | null> {
  try {
    // Since the document requires authentication, we'll use a different approach
    // For now, we'll assume the document name hasn't changed
    // In a real implementation, you'd need to use Google Docs API with proper authentication
    
    const response = await fetch(GOOGLE_DOCS_URL);
    if (!response.ok) {
      console.warn('[VendorSync] Cannot access Google Docs without authentication');
      return null;
    }
    
    const html = await response.text();
    // Parse the HTML to extract the document title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].replace(' - Google Docs', '').trim();
    }
    
    return null;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error fetching document name:', error);
    }
    return null;
  }
}

/**
 * Parse vendor data from Google Docs content
 * This is a placeholder for the actual parsing logic
 */
function parseVendorDataFromDocs(content: string): VendorData | null {
  try {
    // This would need to be implemented based on the actual format in the Google Doc
    // For now, we'll return null to indicate no data could be parsed
    
    // Expected format in the document might be JSON or structured text
    // You would need to implement the parsing logic based on the actual document format
    
    return null;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error parsing vendor data:', error);
    }
    return null;
  }
}

/**
 * Update the local JSON file with new vendor data
 */
async function updateVendorDataFile(newData: VendorData): Promise<void> {
  try {
    // Since we can't directly write to the JSON file in the browser,
    // we'll store the updated data in localStorage instead
    safeStorage.setItem('xpensia_vendor_data_override', JSON.stringify(newData));
    
    if (import.meta.env.MODE === 'development') {
      console.log('[VendorSync] Vendor data updated in localStorage');
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error updating vendor data:', error);
    }
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
    
    // Get stored document name
    const storedName = safeStorage.getItem(VENDOR_SOURCE_KEY);
    
    // Fetch current document name
    const currentName = await fetchDocumentName();
    
    if (!currentName) {
      if (import.meta.env.MODE === 'development') {
        console.log('[VendorSync] Could not fetch document name');
      }
      return false;
    }
    
    // Check if name has changed
    if (storedName !== currentName) {
      if (import.meta.env.MODE === 'development') {
        console.log('[VendorSync] Document name changed:', storedName, '->', currentName);
      }
      
      // Update stored name
      safeStorage.setItem(VENDOR_SOURCE_KEY, currentName);
      
      // Fetch and update vendor data
      // This would require implementing the actual Google Docs data fetching
      // For now, we'll just log the update
      
      if (import.meta.env.MODE === 'development') {
        console.log('[VendorSync] Vendor data sync needed but not implemented yet');
      }
      
      return true;
    }
    
    return false;
    
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error checking for updates:', error);
    }
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