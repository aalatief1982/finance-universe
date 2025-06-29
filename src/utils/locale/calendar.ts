
import { SupportedLocale } from '@/types/locale';
import { getUserSettings } from '../storage-utils';
import { getLocaleSettings } from './settings';
import { DAYS_OF_WEEK, MONTH_NAMES, FIRST_DAY_OF_WEEK } from './data';

/**
 * Gets the day names in the current locale
 */
export const getDayNames = (
  locale?: SupportedLocale,
  format: 'long' | 'short' | 'narrow' = 'long'
): string[] => {
  try {
    const settings = getLocaleSettings();
    const localeCode = locale || settings.locale;
    
    if (format === 'long' && DAYS_OF_WEEK[localeCode]) {
      return DAYS_OF_WEEK[localeCode] as string[];
    }
    
    // Use Intl API to get localized day names
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2021, 0, 3 + i); // Jan 3, 2021 was a Sunday
      days.push(date.toLocaleDateString(localeCode, { weekday: format }));
    }
    return days;
  } catch (error) {
    // Fallback to English
    if (format === 'short') {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    } else if (format === 'narrow') {
      return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    }
    return DAYS_OF_WEEK['en-US'] as string[];
  }
};

/**
 * Gets the month names in the current locale
 */
export const getMonthNames = (
  locale?: SupportedLocale,
  format: 'long' | 'short' | 'narrow' = 'long'
): string[] => {
  try {
    const settings = getLocaleSettings();
    const localeCode = locale || settings.locale;
    
    if (format === 'long' && MONTH_NAMES[localeCode]) {
      return MONTH_NAMES[localeCode] as string[];
    }
    
    // Use Intl API to get localized month names
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(2021, i, 1);
      months.push(date.toLocaleDateString(localeCode, { month: format }));
    }
    return months;
  } catch (error) {
    // Fallback to English
    if (format === 'short') {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    } else if (format === 'narrow') {
      return ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    }
    return MONTH_NAMES['en-US'] as string[];
  }
};

/**
 * Gets the first day of the week for the current locale
 */
export const getFirstDayOfWeek = (locale?: SupportedLocale): 0 | 1 | 6 => {
  try {
    const settings = getLocaleSettings();
    const localeCode = locale || settings.locale;
    
    // First check user preferences
    const userPreferences = getUserSettings();
    if (userPreferences?.displayOptions?.weekStartsOn) {
      switch (userPreferences.displayOptions.weekStartsOn) {
        case 'monday':
          return 1;
        case 'saturday':
          return 6;
        default:
          return 0;
      }
    }
    
    // Then check locale settings
    if (settings.firstDayOfWeek !== undefined) {
      return settings.firstDayOfWeek as 0 | 1 | 6;
    }
    
    // Then check locale defaults
    return FIRST_DAY_OF_WEEK[localeCode] || 0;
  } catch (error) {
    return 0; // Default to Sunday
  }
};
