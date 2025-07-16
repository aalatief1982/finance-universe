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
 */
async function fetchDocumentName(): Promise<string | null> {
  try {
    const response = await fetch(GOOGLE_DOCS_URL);
    if (!response.ok) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[VendorSync] Cannot access Google Docs:', response.status);
      }
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
 * Fetch vendor data from Google Docs
 */
async function fetchVendorDataFromDocs(): Promise<VendorData | null> {
  try {
    const response = await fetch(GOOGLE_DOCS_URL);
    if (!response.ok) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[VendorSync] Cannot access Google Docs content:', response.status);
      }
      return null;
    }
    
    const html = await response.text();
    return parseVendorDataFromDocs(html);
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[VendorSync] Error fetching vendor data from docs:', error);
    }
    return null;
  }
}

/**
 * Parse vendor data from Google Docs content
 */
function parseVendorDataFromDocs(content: string): VendorData | null {
  try {
    // Look for JSON data in the document content
    // The content might be wrapped in <pre> tags or code blocks
    
    // Try to find JSON data between code blocks or pre tags
    let jsonMatch = content.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (!jsonMatch) {
      // Try to find content between code tags
      jsonMatch = content.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
    }
    
    if (!jsonMatch) {
      // Try to find JSON-like content directly
      // Look for patterns that start with { and contain vendor mappings
      const jsonPattern = /\{[\s\S]*?"type":\s*"[^"]*"[\s\S]*?\}/;
      jsonMatch = content.match(jsonPattern);
    }
    
    if (!jsonMatch) {
      // As a fallback, try to parse the entire content as JSON
      const cleanContent = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&quot;/g, '"') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      
      // Try to find the start and end of JSON object
      const startIndex = cleanContent.indexOf('{');
      const lastIndex = cleanContent.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        const jsonString = cleanContent.substring(startIndex, lastIndex + 1);
        return JSON.parse(jsonString);
      }
    } else {
      // Clean and parse the matched JSON
      const jsonString = jsonMatch[1] || jsonMatch[0];
      const cleanedJson = jsonString
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      
      return JSON.parse(cleanedJson);
    }
    
    if (import.meta.env.MODE === 'development') {
      console.warn('[VendorSync] No valid JSON found in document content');
    }
    
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
      const newVendorData = await fetchVendorDataFromDocs();
      if (newVendorData) {
        await updateVendorDataFile(newVendorData);
        if (import.meta.env.MODE === 'development') {
          console.log('[VendorSync] Vendor data successfully synced from Google Docs');
        }
      } else {
        if (import.meta.env.MODE === 'development') {
          console.warn('[VendorSync] Could not parse vendor data from Google Docs');
        }
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