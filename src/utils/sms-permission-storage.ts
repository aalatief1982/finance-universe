
import { safeStorage } from "@/utils/safe-storage";

// Storage keys for SMS permission date tracking
const SMS_PERMISSION_GRANT_DATE_KEY = 'xpensia_sms_permission_grant_date';
const LAST_AUTO_IMPORT_DATE_KEY = 'xpensia_last_auto_import_date';

/**
 * Get the date when SMS permission was first granted
 */
export const getSmsPermissionGrantDate = (): string | null => {
  try {
    return safeStorage.getItem(SMS_PERMISSION_GRANT_DATE_KEY);
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error getting SMS permission grant date:', error);
    }
    return null;
  }
};

/**
 * Set the date when SMS permission was first granted
 */
export const setSmsPermissionGrantDate = (date: string): void => {
  try {
    // Only set if not already set (first-time grant only)
    const existing = getSmsPermissionGrantDate();
    if (!existing) {
      safeStorage.setItem(SMS_PERMISSION_GRANT_DATE_KEY, date);
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS Permission] Grant date recorded:', date);
      }
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error setting SMS permission grant date:', error);
    }
  }
};

/**
 * Get the date of the last automatic import
 */
export const getLastAutoImportDate = (): string | null => {
  try {
    return safeStorage.getItem(LAST_AUTO_IMPORT_DATE_KEY);
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error getting last auto import date:', error);
    }
    return null;
  }
};

/**
 * Set the date of the last automatic import
 */
export const setLastAutoImportDate = (date: string): void => {
  try {
    safeStorage.setItem(LAST_AUTO_IMPORT_DATE_KEY, date);
    if (import.meta.env.MODE === 'development') {
      console.log('[SMS Auto Import] Last import date updated:', date);
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error setting last auto import date:', error);
    }
  }
};

/**
 * Get the appropriate start date for automatic SMS import
 * Uses permission grant date or falls back to 30 days ago
 */
export const getAutoImportStartDate = (): Date => {
  const permissionDate = getSmsPermissionGrantDate();
  const lastImportDate = getLastAutoImportDate();
  
  // Use the later of permission grant date or last import date
  let startDate: Date;
  
  if (lastImportDate && permissionDate) {
    const lastImport = new Date(lastImportDate);
    const permission = new Date(permissionDate);
    startDate = lastImport > permission ? lastImport : permission;
  } else if (lastImportDate) {
    startDate = new Date(lastImportDate);
  } else if (permissionDate) {
    startDate = new Date(permissionDate);
  } else {
    // Fallback to 30 days ago if no dates are available
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }
  
  // Validate the date is not in the future
  const now = new Date();
  if (startDate > now) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }
  
  return startDate;
};
