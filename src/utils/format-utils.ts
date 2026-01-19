import { normalizeCurrencyCode, getCurrencyDisplayName, VALID_CURRENCY_CODES } from './currency-utils';

/**
 * Utility functions for formatting values
 */

/**
 * Get the currency symbol for a given currency code
 * Falls back to the currency code itself if no symbol is available
 * 
 * @param currencyCode The ISO currency code
 * @returns The currency symbol or code
 */
export const getCurrencySymbol = (currencyCode: string = 'USD'): string => {
  try {
    const normalized = normalizeCurrencyCode(currencyCode, 'USD');
    // Use Intl.NumberFormat to get the symbol
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalized,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    
    const symbolPart = parts.find(p => p.type === 'currency');
    return symbolPart?.value || normalized;
  } catch {
    return currencyCode;
  }
};

/**
 * Format a number as currency
 * Includes defensive handling for invalid currency codes (e.g., Arabic names)
 * 
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  try {
    // Normalize the currency code to handle Arabic names and invalid codes
    const validCurrency = normalizeCurrencyCode(currency, 'USD');
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Ultimate fallback - format as number with currency code
    if (import.meta.env.MODE === 'development') {
      console.warn('[formatCurrency] Failed for currency:', currency, error);
    }
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }
};
/**
 * Format a date string to a readable format
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.error('Invalid date string:', dateString);
    }
    return dateString;
  }
};

/**
 * Format a date string to show only month and year
 * @param dateString The date string to format
 * @returns Formatted month and year string
 */
export const formatMonthYear = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.error('Invalid date string:', dateString);
    }
    return dateString;
  }
};
