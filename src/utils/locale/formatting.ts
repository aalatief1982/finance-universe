
import { SupportedLocale } from '@/types/locale';
import { handleError } from '../error-utils';
import { ErrorType } from '@/types/error';
import { getUserSettings } from '../storage-utils';
import { getLocaleSettings } from './settings';

/**
 * Formats a date according to locale settings
 */
export const formatDate = (
  date: Date | string,
  options?: {
    format?: string;
    locale?: SupportedLocale;
    includeTime?: boolean;
  }
): string => {
  try {
    const settings = getLocaleSettings();
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Get format from options or settings
    const dateFormat = options?.format || settings.dateFormat;
    
    // Get locale from options or settings
    const localeCode = options?.locale || settings.locale;
    
    // Check if the user wants to include time
    if (options?.includeTime) {
      const timeFormat = settings.timeFormat;
      return `${formatDateWithPattern(dateObj, dateFormat, localeCode)} ${formatDateWithPattern(dateObj, timeFormat, localeCode)}`;
    }
    
    return formatDateWithPattern(dateObj, dateFormat, localeCode);
  } catch (error) {
    handleError({
      type: ErrorType.FORMATTING,
      message: 'Failed to format date',
      originalError: error
    });
    
    // Fallback formatting
    return typeof date === 'string' ? date : date.toLocaleDateString();
  }
};

/**
 * Formats a date with a specific pattern
 */
const formatDateWithPattern = (
  date: Date,
  pattern: string,
  locale: SupportedLocale
): string => {
  const formatOptions: Intl.DateTimeFormatOptions = {};
  
  // Parse the pattern and set format options
  if (pattern.includes('yyyy')) {
    formatOptions.year = 'numeric';
  } else if (pattern.includes('yy')) {
    formatOptions.year = '2-digit';
  }
  
  if (pattern.includes('MMMM')) {
    formatOptions.month = 'long';
  } else if (pattern.includes('MMM')) {
    formatOptions.month = 'short';
  } else if (pattern.includes('MM')) {
    formatOptions.month = '2-digit';
  } else if (pattern.includes('M')) {
    formatOptions.month = 'numeric';
  }
  
  if (pattern.includes('dddd')) {
    formatOptions.weekday = 'long';
  } else if (pattern.includes('ddd')) {
    formatOptions.weekday = 'short';
  } else if (pattern.includes('dd')) {
    formatOptions.day = '2-digit';
  } else if (pattern.includes('d')) {
    formatOptions.day = 'numeric';
  }
  
  if (pattern.includes('HH')) {
    formatOptions.hour = '2-digit';
    formatOptions.hour12 = false;
  } else if (pattern.includes('hh')) {
    formatOptions.hour = '2-digit';
    formatOptions.hour12 = true;
  } else if (pattern.includes('h')) {
    formatOptions.hour = 'numeric';
    formatOptions.hour12 = true;
  }
  
  if (pattern.includes('mm')) {
    formatOptions.minute = '2-digit';
  } else if (pattern.includes('m')) {
    formatOptions.minute = 'numeric';
  }
  
  if (pattern.includes('ss')) {
    formatOptions.second = '2-digit';
  } else if (pattern.includes('s')) {
    formatOptions.second = 'numeric';
  }
  
  if (pattern.includes('a')) {
    formatOptions.hour12 = true;
  }
  
  return date.toLocaleString(locale, formatOptions);
};

/**
 * Formats a number according to locale settings
 */
export const formatNumber = (
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
    locale?: SupportedLocale;
  }
): string => {
  try {
    const settings = getLocaleSettings();
    const localeCode = options?.locale || settings.locale;
    
    // Get number format options from settings or override with provided options
    const formatOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: 
        options?.minimumFractionDigits !== undefined ?
        options.minimumFractionDigits :
        settings.numberFormat.minimumFractionDigits,
      maximumFractionDigits:
        options?.maximumFractionDigits !== undefined ?
        options.maximumFractionDigits :
        settings.numberFormat.maximumFractionDigits,
      useGrouping:
        options?.useGrouping !== undefined ?
        options.useGrouping :
        settings.numberFormat.useGrouping
    };
    
    return value.toLocaleString(localeCode, formatOptions);
  } catch (error) {
    handleError({
      type: ErrorType.FORMATTING,
      message: 'Failed to format number',
      originalError: error
    });
    
    // Fallback formatting
    return value.toString();
  }
};
