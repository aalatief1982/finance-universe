import { SupportedLocale, SupportedCurrency, LocaleSettings } from '@/types/locale';
import { handleError } from '../error-utils';
import { ErrorType } from '@/types/error';
import { getUserSettings, getLocaleSettings as getStoredLocaleSettings, storeLocaleSettings } from '../storage-utils';
import { UserPreferences } from '@/types/user';

// Default locale settings
export const DEFAULT_LOCALE_SETTINGS: LocaleSettings = {
  locale: 'en-US',
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'h:mm a',
  firstDayOfWeek: 0,
  numberFormat: {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
};

/**
 * Gets the stored locale settings or returns defaults, with integration from user preferences
 */
export const getLocaleSettings = (): LocaleSettings => {
  try {
    // First try to get from storage-utils
    const storedSettings = getStoredLocaleSettings();
    
    // Then try to get user preferences and integrate them
    const userPreferences = getUserSettings();
    if (userPreferences) {
      // Merge settings from user preferences
      return {
        ...storedSettings,
        currency: userPreferences.currency as SupportedCurrency || storedSettings.currency,
        locale: userPreferences.language === 'en' ? 'en-US' : 
                (userPreferences.language && isValidLocale(`${userPreferences.language}-${userPreferences.language.toUpperCase()}`) ? 
                `${userPreferences.language}-${userPreferences.language.toUpperCase()}` as SupportedLocale : 
                storedSettings.locale),
        firstDayOfWeek: userPreferences.displayOptions?.weekStartsOn === 'monday' ? 1 : 0,
        // If user has date and time format in preferences, use those
        dateFormat: mapDateFormat(userPreferences),
        timeFormat: mapTimeFormat(userPreferences),
        numberFormat: {
          useGrouping: true,
          minimumFractionDigits: userPreferences.displayOptions?.showCents ? 2 : 0,
          maximumFractionDigits: userPreferences.displayOptions?.showCents ? 2 : 0
        }
      };
    }
    
    return storedSettings;
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load locale settings',
      originalError: error
    });
    
    return DEFAULT_LOCALE_SETTINGS;
  }
};

/**
 * Map user preferences to date format string
 */
const mapDateFormat = (preferences: UserPreferences): string => {
  if (!preferences.displayOptions?.dateFormat) {
    return 'MM/dd/yyyy';
  }
  
  switch (preferences.displayOptions.dateFormat) {
    case 'MM/DD/YYYY':
      return 'MM/dd/yyyy';
    case 'DD/MM/YYYY':
      return 'dd/MM/yyyy';
    case 'YYYY-MM-DD':
      return 'yyyy-MM-dd';
    default:
      return 'MM/dd/yyyy';
  }
};

/**
 * Map user preferences to time format string
 */
const mapTimeFormat = (preferences: UserPreferences): string => {
  if (!preferences.displayOptions?.timeFormat) {
    return 'h:mm a';
  }
  
  return preferences.displayOptions.timeFormat === '24h' ? 'HH:mm' : 'h:mm a';
};

/**
 * Checks if a locale string is valid
 */
export const isValidLocale = (locale: string): boolean => {
  return Object.keys(LOCALE_DISPLAY_NAMES).includes(locale);
};

// Fix the updateLocaleSettings function to handle display options correctly
export const updateLocaleSettings = (settings: Partial<LocaleSettings>, syncUserPrefs = true): void => {
  try {
    const currentSettings = getLocaleSettings();
    const newSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Save to storage
    storeLocaleSettings(newSettings);
    
    // Sync with user preferences if requested
    if (syncUserPrefs) {
      const userSettings = getUserSettings();
      
      // Only update user settings if they exist
      if (userSettings) {
        const displayOptions = userSettings.displayOptions || {};
        
        // Update user preferences with the new locale settings
        import('../storage-utils').then(({ storeUserSettings }) => {
          storeUserSettings({
            ...userSettings,
            currency: settings.currency || userSettings.currency,
            language: settings.locale ? settings.locale.split('-')[0] : userSettings.language,
            displayOptions: {
              // Preserve existing display options
              showCents: settings.numberFormat?.minimumFractionDigits !== 0,
              weekStartsOn: settings.firstDayOfWeek === 1 ? 'monday' : 'sunday',
              // Keep existing values or use defaults
              defaultView: displayOptions.defaultView || 'list',
              compactMode: displayOptions.compactMode !== undefined ? displayOptions.compactMode : false,
              showCategories: displayOptions.showCategories !== undefined ? displayOptions.showCategories : true,
              showTags: displayOptions.showTags !== undefined ? displayOptions.showTags : true,
              // Map date format
              dateFormat: settings.dateFormat === 'dd/MM/yyyy' ? 'DD/MM/YYYY' : 
                          settings.dateFormat === 'yyyy-MM-dd' ? 'YYYY-MM-DD' : 
                          'MM/DD/YYYY',
              // Map time format
              timeFormat: settings.timeFormat === 'HH:mm' ? '24h' : '12h'
            }
          });
        });
      }
    }
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to update locale settings',
      originalError: error
    });
  }
};

// Import these from data.ts
import { LOCALE_DISPLAY_NAMES } from './data';

/**
 * Gets the display name for a locale
 */
export const getLocaleDisplayName = (localeCode: SupportedLocale): string => {
  return LOCALE_DISPLAY_NAMES[localeCode] || localeCode;
};
