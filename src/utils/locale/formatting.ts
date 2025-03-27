
import { SupportedLocale } from '@/types/locale';
import { handleError } from '../error-utils';
import { ErrorType } from '@/types/error';
import { getUserSettings } from '../storage-utils';
import { getLocaleSettings } from './settings';

/**
 * Formats a number based on locale settings and user preferences
 */
export const formatNumber = (
  value: number,
  options?: {
    locale?: SupportedLocale;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  }
): string => {
  try {
    const settings = getLocaleSettings();
    const localeCode = options?.locale || settings.locale;
    const userPreferences = getUserSettings();
    
    // Respect user's setting for showing decimals
    const showDecimals = userPreferences?.displayOptions?.showCents !== false;
    
    return new Intl.NumberFormat(localeCode, {
      minimumFractionDigits: options?.minimumFractionDigits !== undefined ? 
        options.minimumFractionDigits : 
        (showDecimals ? settings.numberFormat?.minimumFractionDigits || 2 : 0),
      maximumFractionDigits: options?.maximumFractionDigits !== undefined ? 
        options.maximumFractionDigits : 
        (showDecimals ? settings.numberFormat?.maximumFractionDigits || 2 : 0),
      useGrouping: options?.useGrouping !== undefined ? 
        options.useGrouping : 
        settings.numberFormat?.useGrouping !== false
    }).format(value);
  } catch (error) {
    handleError({
      type: ErrorType.UNKNOWN,
      message: 'Failed to format number',
      originalError: error
    });
    
    // Fallback
    return value.toString();
  }
};

/**
 * Formats a date based on the current locale settings and user preferences
 */
export const formatDate = (
  date: Date | string,
  options?: {
    format?: 'short' | 'medium' | 'long' | 'full';
    locale?: SupportedLocale;
    showWeekday?: boolean;
  }
): string => {
  try {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObject.getTime())) {
      throw new Error('Invalid date');
    }
    
    const settings = getLocaleSettings();
    const localeCode = options?.locale || settings.locale;
    
    // Format options based on requested format
    let formatOptions: Intl.DateTimeFormatOptions = {};
    
    switch (options?.format) {
      case 'short':
        formatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
        break;
      case 'medium':
        formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        break;
      case 'long':
        formatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        break;
      case 'full':
        formatOptions = { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        };
        break;
      default:
        // Use custom format from settings if no format option was provided
        // This is just a simplistic implementation that doesn't handle all format patterns
        if (options?.showWeekday) {
          formatOptions = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          };
        } else {
          formatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          };
        }
    }
    
    return dateObject.toLocaleDateString(localeCode, formatOptions);
  } catch (error) {
    handleError({
      type: ErrorType.UNKNOWN,
      message: 'Failed to format date',
      originalError: error
    });
    
    // Fallback formatting
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    return dateObject.toLocaleDateString();
  }
};

/**
 * Formats a time based on locale settings and user preferences
 */
export const formatTime = (
  time: Date | string,
  options?: {
    format?: 'short' | 'medium' | 'long';
    locale?: SupportedLocale;
    includeSeconds?: boolean;
  }
): string => {
  try {
    const timeObject = typeof time === 'string' ? new Date(time) : time;
    if (isNaN(timeObject.getTime())) {
      throw new Error('Invalid date');
    }
    
    const settings = getLocaleSettings();
    const localeCode = options?.locale || settings.locale;
    const userPreferences = getUserSettings();
    
    // Determine if we should use 24h time
    const use24Hour = settings.timeFormat === 'HH:mm' || 
                     userPreferences?.displayOptions?.timeFormat === '24h';
    
    let formatOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: !use24Hour
    };
    
    if (options?.includeSeconds) {
      formatOptions.second = 'numeric';
    }
    
    return timeObject.toLocaleTimeString(localeCode, formatOptions);
  } catch (error) {
    handleError({
      type: ErrorType.UNKNOWN,
      message: 'Failed to format time',
      originalError: error
    });
    
    // Fallback
    const timeObject = typeof time === 'string' ? new Date(time) : time;
    return timeObject.toLocaleTimeString();
  }
};

/**
 * Formats a datetime based on locale settings and user preferences
 */
export const formatDateTime = (
  datetime: Date | string,
  options?: {
    dateFormat?: 'short' | 'medium' | 'long' | 'full';
    timeFormat?: 'short' | 'medium' | 'long';
    locale?: SupportedLocale;
    includeSeconds?: boolean;
  }
): string => {
  try {
    return `${formatDate(datetime, { format: options?.dateFormat, locale: options?.locale })} ${formatTime(datetime, { format: options?.timeFormat, locale: options?.locale, includeSeconds: options?.includeSeconds })}`;
  } catch (error) {
    handleError({
      type: ErrorType.UNKNOWN,
      message: 'Failed to format datetime',
      originalError: error
    });
    
    // Fallback
    const datetimeObject = typeof datetime === 'string' ? new Date(datetime) : datetime;
    return datetimeObject.toLocaleString();
  }
};

/**
 * Formats a relative time (e.g., "2 days ago", "in 3 hours")
 */
export const formatRelativeTime = (
  date: Date | string,
  options?: {
    locale?: SupportedLocale;
    style?: 'long' | 'short' | 'narrow';
  }
): string => {
  try {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObject.getTime())) {
      throw new Error('Invalid date');
    }
    
    const settings = getLocaleSettings();
    const localeCode = options?.locale || settings.locale;
    const now = new Date();
    const diffMs = dateObject.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);
    
    // Use Intl.RelativeTimeFormat if available
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat(localeCode, { 
        style: options?.style || 'long' 
      });
      
      if (Math.abs(diffSec) < 60) {
        return rtf.format(diffSec, 'second');
      } else if (Math.abs(diffMin) < 60) {
        return rtf.format(diffMin, 'minute');
      } else if (Math.abs(diffHour) < 24) {
        return rtf.format(diffHour, 'hour');
      } else if (Math.abs(diffDay) < 30) {
        return rtf.format(diffDay, 'day');
      } else if (Math.abs(diffMonth) < 12) {
        return rtf.format(diffMonth, 'month');
      } else {
        return rtf.format(diffYear, 'year');
      }
    }
    
    // Fallback for older browsers
    if (diffMs < 0) {
      // In the past
      if (Math.abs(diffSec) < 60) {
        return `${Math.abs(diffSec)} seconds ago`;
      } else if (Math.abs(diffMin) < 60) {
        return `${Math.abs(diffMin)} minutes ago`;
      } else if (Math.abs(diffHour) < 24) {
        return `${Math.abs(diffHour)} hours ago`;
      } else if (Math.abs(diffDay) < 30) {
        return `${Math.abs(diffDay)} days ago`;
      } else if (Math.abs(diffMonth) < 12) {
        return `${Math.abs(diffMonth)} months ago`;
      } else {
        return `${Math.abs(diffYear)} years ago`;
      }
    } else {
      // In the future
      if (Math.abs(diffSec) < 60) {
        return `in ${diffSec} seconds`;
      } else if (Math.abs(diffMin) < 60) {
        return `in ${diffMin} minutes`;
      } else if (Math.abs(diffHour) < 24) {
        return `in ${diffHour} hours`;
      } else if (Math.abs(diffDay) < 30) {
        return `in ${diffDay} days`;
      } else if (Math.abs(diffMonth) < 12) {
        return `in ${diffMonth} months`;
      } else {
        return `in ${diffYear} years`;
      }
    }
  } catch (error) {
    handleError({
      type: ErrorType.UNKNOWN,
      message: 'Failed to format relative time',
      originalError: error
    });
    
    // Fallback
    return formatDate(date, { format: 'medium' });
  }
};
