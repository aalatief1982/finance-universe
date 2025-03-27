import { SupportedLocale, SupportedCurrency, LocaleSettings, CurrencyInfo } from '@/types/locale';
import { handleError } from './error-utils';
import { ErrorType } from '@/types/error';
import { getUserSettings, getLocaleSettings as getStoredLocaleSettings, storeLocaleSettings } from './storage-utils';
import { UserPreferences } from '@/types/user';

// Default locale settings
const DEFAULT_LOCALE_SETTINGS: LocaleSettings = {
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

// Currency information lookup - we're only implementing a subset of the currencies for now
// Note: This is a partial implementation. In a real app, all currencies from SupportedCurrency would be included
const CURRENCY_INFO: Partial<Record<SupportedCurrency, CurrencyInfo>> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    namePlural: 'US Dollars',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    namePlural: 'Euros',
    decimalPlaces: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ',',
    spaceBetweenAmountAndSymbol: true
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    namePlural: 'British Pounds',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    namePlural: 'Japanese Yen',
    decimalPlaces: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    namePlural: 'Canadian Dollars',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    namePlural: 'Australian Dollars',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    namePlural: 'Swiss Francs',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: '\'',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    namePlural: 'Chinese Yuan',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    namePlural: 'Indian Rupees',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  }
};

// Locale information mapping - we're only implementing a subset of locales for now
// Note: This is a partial implementation. In a real app, all locales from SupportedLocale would be included
const LOCALE_DISPLAY_NAMES: Partial<Record<SupportedLocale, string>> = {
  'en-US': 'English (United States)',
  'en-GB': 'English (United Kingdom)',
  'es-ES': 'Español (España)',
  'fr-FR': 'Français (France)',
  'de-DE': 'Deutsch (Deutschland)',
  'ja-JP': '日本語 (日本)',
  'zh-CN': '中文 (中国)',
  'pt-BR': 'Português (Brasil)',
  'it-IT': 'Italiano (Italia)',
  'ru-RU': 'Русский (Россия)'
};

// Day of week mapping - we're only implementing a subset for now
const DAYS_OF_WEEK: Partial<Record<SupportedLocale, string[]>> = {
  'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'en-GB': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'es-ES': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  'fr-FR': ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  'de-DE': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  'ja-JP': ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  'zh-CN': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  'pt-BR': ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  'it-IT': ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  'ru-RU': ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
};

// Month names mapping - partial implementation
const MONTH_NAMES: Partial<Record<SupportedLocale, string[]>> = {
  'en-US': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  'en-GB': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  'es-ES': ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  'fr-FR': ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  'de-DE': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  'ja-JP': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  'zh-CN': ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  'pt-BR': ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  'it-IT': ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  'ru-RU': ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
};

// First day of week by locale - partial implementation
const FIRST_DAY_OF_WEEK: Partial<Record<SupportedLocale, 0 | 1>> = {
  'en-US': 0, // Sunday
  'en-GB': 1, // Monday
  'es-ES': 1, // Monday
  'fr-FR': 1, // Monday
  'de-DE': 1, // Monday
  'ja-JP': 0, // Sunday
  'zh-CN': 1, // Monday
  'pt-BR': 0, // Sunday
  'it-IT': 1, // Monday
  'ru-RU': 1  // Monday
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
const isValidLocale = (locale: string): boolean => {
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
        import('./storage-utils').then(({ storeUserSettings }) => {
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
              compactMode: typeof displayOptions.compactMode !== 'undefined' ? displayOptions.compactMode : false,
              showCategories: typeof displayOptions.showCategories !== 'undefined' ? displayOptions.showCategories : true,
              showTags: typeof displayOptions.showTags !== 'undefined' ? displayOptions.showTags : true,
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

// Fix the getCurrencyInfo function to handle missing currencies
export const getCurrencyInfo = (currency: SupportedCurrency): CurrencyInfo => {
  return (CURRENCY_INFO[currency] || CURRENCY_INFO.USD) as CurrencyInfo;
};

/**
 * Gets all available currencies
 */
export const getAllCurrencies = (): CurrencyInfo[] => {
  return Object.values(CURRENCY_INFO).filter(Boolean) as CurrencyInfo[];
};

/**
 * Gets all available locales
 */
export const getAllLocales = (): { code: SupportedLocale, name: string }[] => {
  return Object.entries(LOCALE_DISPLAY_NAMES).map(([code, name]) => ({
    code: code as SupportedLocale,
    name
  }));
};

/**
 * Formats a number as currency based on user preferences
 */
export const formatCurrency = (
  amount: number,
  options?: {
    currency?: SupportedCurrency;
    locale?: SupportedLocale;
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  try {
    const settings = getLocaleSettings();
    const currencyCode = options?.currency || settings.currency;
    const localeCode = options?.locale || settings.locale;
    const currencyInfo = getCurrencyInfo(currencyCode);
    const userPreferences = getUserSettings();
    
    // Respect user's setting for showing cents
    const showCents = userPreferences?.displayOptions?.showCents !== false;
    const minFractionDigits = options?.minimumFractionDigits !== undefined ? 
      options.minimumFractionDigits : 
      (showCents ? currencyInfo.decimalPlaces : 0);
    
    const maxFractionDigits = options?.maximumFractionDigits !== undefined ? 
      options.maximumFractionDigits : 
      (showCents ? currencyInfo.decimalPlaces : 0);
    
    // Check if we should mask amounts based on user privacy settings
    const shouldMaskAmount = userPreferences?.privacy?.maskAmounts === true;
    if (shouldMaskAmount) {
      return '•••••';
    }
    
    // Format the number
    let formatted = new Intl.NumberFormat(localeCode, {
      style: options?.showSymbol === false ? 'decimal' : 'currency',
      currency: currencyCode,
      currencyDisplay: options?.showCode ? 'code' : 'symbol',
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    }).format(amount);
    
    return formatted;
  } catch (error) {
    handleError({
      type: ErrorType.CURRENCY,
      message: 'Failed to format currency',
      originalError: error
    });
    
    // Fallback formatting
    const currencyInfo = getCurrencyInfo(options?.currency || DEFAULT_LOCALE_SETTINGS.currency);
    const formatted = amount.toFixed(currencyInfo.decimalPlaces);
    
    return currencyInfo.symbolPosition === 'before'
      ? `${currencyInfo.symbol}${formatted}`
      : `${formatted}${currencyInfo.symbol}`;
  }
};

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
export const getFirstDayOfWeek = (locale?: SupportedLocale): 0 | 1 => {
  try {
    const settings = getLocaleSettings();
    const localeCode = locale || settings.locale;
    
    // First check user preferences
    const userPreferences = getUserSettings();
    if (userPreferences?.displayOptions?.weekStartsOn) {
      return userPreferences.displayOptions.weekStartsOn === 'monday' ? 1 : 0;
    }
    
    // Then check locale settings
    if (settings.firstDayOfWeek !== undefined) {
      return settings.firstDayOfWeek as 0 | 1;
    }
    
    // Then check locale defaults
    return FIRST_DAY_OF_WEEK[localeCode] || 0;
  } catch (error) {
    return 0; // Default to Sunday
  }
};

/**
 * Gets the display name for a currency
 */
export const getCurrencyDisplayName = (currencyCode: SupportedCurrency): string => {
  const currencyInfo = getCurrencyInfo(currencyCode);
  return currencyInfo.name;
};

/**
 * Gets the display name for a locale
 */
export const getLocaleDisplayName = (localeCode: SupportedLocale): string => {
  return LOCALE_DISPLAY_NAMES[localeCode] || localeCode;
};

/**
 * Converts an amount from one currency to another
 * Note: In a real app, this would use exchange rates from an API
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): number => {
  // This is a placeholder implementation
  // In a real app, you'd use an exchange rate API
  const exchangeRates: Record<string, number> = {
    'USD_EUR': 0.85,
    'USD_GBP': 0.75,
    'USD_JPY': 110.5,
    'USD_CAD': 1.25,
    'USD_AUD': 1.35,
    'USD_CHF': 0.92,
    'USD_CNY': 6.45,
    'USD_INR': 74.5,
    'EUR_USD': 1.18,
    'GBP_USD': 1.33,
    'JPY_USD': 0.0091,
    'CAD_USD': 0.8,
    'AUD_USD': 0.74,
    'CHF_USD': 1.09,
    'CNY_USD': 0.155,
    'INR_USD': 0.0134
  };
  
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const inverseRateKey = `${toCurrency}_${fromCurrency}`;
  
  if (exchangeRates[rateKey]) {
    return amount * exchangeRates[rateKey];
  } else if (exchangeRates[inverseRateKey]) {
    return amount / exchangeRates[inverseRateKey];
  } else {
    // Convert via USD as a bridge
    const fromToUsd = fromCurrency === 'USD' ? 1 : (exchangeRates[`${fromCurrency}_USD`] || (1 / exchangeRates[`USD_${fromCurrency}`]));
    const usdToTarget = toCurrency === 'USD' ? 1 : (exchangeRates[`USD_${toCurrency}`] || (1 / exchangeRates[`${toCurrency}_USD`]));
    
    return
