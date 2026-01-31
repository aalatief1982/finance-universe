/**
 * @file currency-utils.ts
 * @description Currency normalization and validation helpers.
 *
 * @module utils/currency-utils
 *
 * @responsibilities
 * 1. Normalize Arabic/English currency names to ISO codes
 * 2. Provide valid currency code lists
 * 3. Expose helpers for currency validation
 *
 * @review-tags
 * - @risk: incomplete mapping for regional names
 *
 * @review-checklist
 * - [ ] Arabic currency names map to correct ISO codes
 * - [ ] Invalid values fall back to safe defaults
 */

/**
 * Currency utilities for normalization and validation
 * Handles Arabic currency names and ISO code mapping
 */

// Currency name to ISO code mapping for common Arabic/English terms
export const CURRENCY_NAME_TO_CODE: Record<string, string> = {
  // Arabic currency names
  'جنيه': 'EGP',
  'جنيه مصري': 'EGP',
  'جنيه مصرى': 'EGP',
  'ريال': 'SAR',
  'ر.س': 'SAR',
  'ر. س': 'SAR',
  'ر س': 'SAR',
  'درهم': 'AED',
  'دولار': 'USD',
  'يورو': 'EUR',
  'دينار': 'KWD', // Default to Kuwaiti Dinar for generic 'dinar'
  'دينار كويتي': 'KWD',
  'دينار بحريني': 'BHD',
  'دينار اردني': 'JOD',
  'ليرة': 'LBP',
  'ليرة لبنانية': 'LBP',
  
  // English currency names (lowercase)
  'dollar': 'USD',
  'dollars': 'USD',
  'pound': 'GBP',
  'pounds': 'GBP',
  'euro': 'EUR',
  'euros': 'EUR',
  'yen': 'JPY',
  'rupee': 'INR',
  'rupees': 'INR',
  'riyal': 'SAR',
  'riyals': 'SAR',
  'dirham': 'AED',
  'dirhams': 'AED',
};

// Set of valid ISO 4217 currency codes
export const VALID_CURRENCY_CODES = new Set([
  // Major currencies
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'NZD',
  // Middle East / Africa
  'EGP', 'SAR', 'AED', 'BHD', 'KWD', 'OMR', 'QAR', 'JOD', 'LBP', 'IQD',
  'SYP', 'YER', 'TND', 'DZD', 'MAD', 'LYD', 'SDG', 'ZAR',
  // Asia
  'PKR', 'BDT', 'LKR', 'NPR', 'THB', 'MYR', 'SGD', 'IDR', 'PHP', 'VND',
  'KRW', 'TWD', 'HKD',
  // Europe
  'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB',
  'TRY', 'UAH',
  // Americas
  'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN',
]);

/**
 * Normalizes a currency string to a valid ISO 4217 code
 * Handles Arabic currency names, common variations, and invalid values
 * 
 * @param currency - The currency string to normalize (can be ISO code or name)
 * @param fallback - The fallback currency code if normalization fails (default: 'USD')
 * @returns A valid ISO 4217 currency code
 */
export const normalizeCurrencyCode = (
  currency: string | undefined | null,
  fallback: string = 'USD'
): string => {
  if (!currency) return fallback;
  
  const trimmed = currency.trim();
  if (!trimmed) return fallback;
  
  const upper = trimmed.toUpperCase();
  
  // Already a valid ISO code
  if (VALID_CURRENCY_CODES.has(upper)) {
    return upper;
  }
  
  // Check exact match in name mappings (for Arabic)
  if (CURRENCY_NAME_TO_CODE[trimmed]) {
    return CURRENCY_NAME_TO_CODE[trimmed];
  }
  
  // Check lowercase match (for English names)
  const lower = trimmed.toLowerCase();
  if (CURRENCY_NAME_TO_CODE[lower]) {
    return CURRENCY_NAME_TO_CODE[lower];
  }
  
  // Check if the string contains a valid currency code
  for (const code of VALID_CURRENCY_CODES) {
    if (upper.includes(code)) {
      return code;
    }
  }
  
  // Log unknown currencies in development
  if (import.meta.env.MODE === 'development') {
    console.warn('[Currency] Unknown currency code:', currency, '- defaulting to', fallback);
  }
  
  return fallback;
};

/**
 * Checks if a string is a valid ISO 4217 currency code
 * 
 * @param code - The currency code to validate
 * @returns true if the code is a valid ISO 4217 currency code
 */
export const isValidCurrencyCode = (code: string | undefined | null): boolean => {
  if (!code) return false;
  return VALID_CURRENCY_CODES.has(code.toUpperCase().trim());
};

/**
 * Gets the display name for a currency code
 * Returns the code itself if no display name is available
 * 
 * @param code - The ISO currency code
 * @returns The display name or the code itself
 */
export const getCurrencyDisplayName = (code: string): string => {
  const displayNames: Record<string, string> = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'JPY': 'Japanese Yen',
    'EGP': 'Egyptian Pound',
    'SAR': 'Saudi Riyal',
    'AED': 'UAE Dirham',
    'KWD': 'Kuwaiti Dinar',
    'BHD': 'Bahraini Dinar',
    'QAR': 'Qatari Riyal',
    'OMR': 'Omani Rial',
    'JOD': 'Jordanian Dinar',
    'LBP': 'Lebanese Pound',
    'INR': 'Indian Rupee',
    'PKR': 'Pakistani Rupee',
  };
  
  return displayNames[code.toUpperCase()] || code;
};
