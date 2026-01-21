import { normalizeCurrencyCode, getCurrencyDisplayName, VALID_CURRENCY_CODES } from './currency-utils';
import { getUserSettings } from '@/utils/storage-utils';

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
export const getCurrencySymbol = (currencyCode?: string): string => {
  const preferred = getUserSettings().currency || 'USD';
  const requested = currencyCode ?? preferred;
  try {
    const normalized = normalizeCurrencyCode(requested, preferred);
    
    // If the requested code was unknown (normalized to something different),
    // return the original requested code instead of the fallback's symbol
    if (normalized !== requested.toUpperCase() && 
        !VALID_CURRENCY_CODES.has(requested.toUpperCase())) {
      return requested;
    }
    
    // Use Intl.NumberFormat to get the symbol
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalized,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);

    const symbolPart = parts.find(p => p.type === 'currency');
    return symbolPart?.value || normalized;
  } catch {
    return requested;
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
export const formatCurrency = (amount: number, currency?: string): string => {
  const preferred = getUserSettings().currency || 'USD';
  const requested = currency ?? preferred;
  try {
    // Normalize the currency code to handle Arabic names and invalid codes
    const validCurrency = normalizeCurrencyCode(requested, preferred);

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  } catch (error) {
    // Ultimate fallback - format as number with currency symbol/code
    if (import.meta.env.MODE === 'development') {
      console.warn('[formatCurrency] Failed for currency:', requested, error);
    }
    const symbol = getCurrencySymbol(requested);
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
