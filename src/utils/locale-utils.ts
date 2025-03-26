
import { SupportedLocale, SupportedCurrency, LocaleSettings, CurrencyInfo } from '@/types/locale';
import { handleError } from './error-utils';
import { ErrorType } from '@/types/error';

// Default locale settings
const DEFAULT_LOCALE_SETTINGS: LocaleSettings = {
  locale: 'en-US',
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'h:mm a',
};

// Storage key for locale settings
const LOCALE_SETTINGS_KEY = 'locale_settings';

// Currency information lookup
const CURRENCY_INFO: Record<SupportedCurrency, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

/**
 * Gets the stored locale settings or returns defaults
 */
export const getLocaleSettings = (): LocaleSettings => {
  try {
    const storedSettings = localStorage.getItem(LOCALE_SETTINGS_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings) as LocaleSettings;
    }
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to load locale settings',
      originalError: error
    });
  }
  
  return DEFAULT_LOCALE_SETTINGS;
};

/**
 * Stores locale settings
 */
export const saveLocaleSettings = (settings: LocaleSettings): void => {
  try {
    localStorage.setItem(LOCALE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    handleError({
      type: ErrorType.STORAGE,
      message: 'Failed to save locale settings',
      originalError: error
    });
  }
};

/**
 * Gets information about a specific currency
 */
export const getCurrencyInfo = (currency: SupportedCurrency): CurrencyInfo => {
  return CURRENCY_INFO[currency] || CURRENCY_INFO.USD;
};

/**
 * Formats a number as currency
 */
export const formatCurrency = (
  amount: number,
  currency?: SupportedCurrency,
  locale?: SupportedLocale
): string => {
  try {
    const settings = getLocaleSettings();
    const currencyCode = currency || settings.currency;
    const localeCode = locale || settings.locale;
    
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    handleError({
      type: ErrorType.CURRENCY,
      message: 'Failed to format currency',
      originalError: error
    });
    
    // Fallback formatting
    const currencyInfo = getCurrencyInfo(currency || DEFAULT_LOCALE_SETTINGS.currency);
    const formatted = amount.toFixed(currencyInfo.decimalPlaces);
    
    return currencyInfo.symbolPosition === 'before'
      ? `${currencyInfo.symbol}${formatted}`
      : `${formatted}${currencyInfo.symbol}`;
  }
};

/**
 * Formats a date based on the current locale settings
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    const settings = getLocaleSettings();
    
    return dateObject.toLocaleDateString(settings.locale);
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
