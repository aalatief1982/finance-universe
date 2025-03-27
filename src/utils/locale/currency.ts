
import { SupportedCurrency, CurrencyInfo, SupportedLocale } from '@/types/locale';
import { handleError } from '../error-utils';
import { ErrorType } from '@/types/error';
import { getUserSettings } from '../storage-utils';
import { getLocaleSettings } from './settings';

// Import currency data
import { CURRENCY_INFO } from './data';

/**
 * Gets the currency info for a currency code
 */
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
 * Gets the display name for a currency
 */
export const getCurrencyDisplayName = (currencyCode: SupportedCurrency): string => {
  const currencyInfo = getCurrencyInfo(currencyCode);
  return currencyInfo.name;
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
    const currencyInfo = getCurrencyInfo(options?.currency || 'USD');
    const formatted = amount.toFixed(currencyInfo.decimalPlaces);
    
    return currencyInfo.symbolPosition === 'before'
      ? `${currencyInfo.symbol}${formatted}`
      : `${formatted}${currencyInfo.symbol}`;
  }
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
    
    return amount * fromToUsd * usdToTarget;
  }
};
