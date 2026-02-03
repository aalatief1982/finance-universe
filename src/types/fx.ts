/**
 * @file fx.ts
 * @description Type definitions for foreign exchange (FX) functionality.
 *
 * @module types/fx
 *
 * @responsibilities
 * 1. Define FX rate cache structure
 * 2. Define conversion result types
 * 3. Provide constants for FX precision and storage
 *
 * @review-tags
 * - @data-contract: FX types used across services and storage
 */

/**
 * Source of the exchange rate used for conversion.
 * - 'identity': Same currency, no conversion needed (rate = 1)
 * - 'cached': Rate retrieved from local cache
 * - 'api': Rate fetched from external API
 * - 'manual': User manually entered the rate
 * - 'missing': No rate available (offline/unavailable)
 */
export type FxSource = 'identity' | 'cached' | 'api' | 'manual' | 'missing';

/**
 * User preference for handling missing FX rates.
 * - 'manual': Prompt user to enter rate manually
 * - 'cachedOnly': Block save if no cached rate exists
 * - 'allowMissing': Allow save with null conversion values
 */
export type FxFallbackMode = 'manual' | 'cachedOnly' | 'allowMissing';

/**
 * FX-related user preferences stored in user settings.
 */
export interface FxPreferences {
  /** Optional external rate provider identifier */
  provider?: string;
  /** How to handle missing rates */
  fallbackMode: FxFallbackMode;
  /** Whether to show warnings for unconverted transactions */
  showUnconvertedWarning: boolean;
}

/**
 * A single cached exchange rate entry.
 */
export interface CachedFxRate {
  /** The exchange rate (from -> to) with 8 decimal precision */
  rate: number;
  /** Provider that supplied the rate */
  provider: 'manual' | 'exchangerate-api' | 'openexchangerates' | 'fixer';
  /** When the rate was fetched/entered (ISO timestamp) */
  fetchedAt: string;
  /** When the rate expires (ISO timestamp) */
  expiresAt: string;
}

/**
 * Structure of the FX rate cache in localStorage.
 */
export interface FxRateCache {
  /** Map of "YYYY-MM-DD:FROM:TO" -> rate entry */
  rates: Record<string, CachedFxRate>;
  /** Last time the cache was updated (ISO timestamp) */
  lastUpdated: string;
}

/**
 * Result of looking up an exchange rate.
 */
export interface FxRateLookupResult {
  /** The exchange rate, or null if not found */
  rate: number | null;
  /** Source of the rate */
  source: FxSource;
  /** Provider if available */
  provider?: string;
  /** When the rate was locked (ISO timestamp) */
  lockedAt?: string;
}

/**
 * FX fields to be added to a transaction at save time.
 */
export interface TransactionFxFields {
  /** ISO 4217 currency code of the transaction */
  currency: string;
  /** User's base currency at time of save (snapshot for audit) */
  baseCurrency: string;
  /** Amount converted to base currency, null if unconverted */
  amountInBase: number | null;
  /** Exchange rate used (currency -> baseCurrency), null if unconverted */
  fxRateToBase: number | null;
  /** Source of the exchange rate */
  fxSource: FxSource;
  /** When the rate was locked (ISO timestamp), null if unconverted */
  fxLockedAt: string | null;
  /** Currency pair notation, e.g., "USD->SAR" */
  fxPair: string | null;
}

/**
 * Result of applying FX conversion to a transaction.
 */
export interface FxConversionResult {
  /** Whether conversion was successful */
  success: boolean;
  /** The FX fields to apply to the transaction */
  fields: TransactionFxFields;
  /** Warning message if conversion is missing/estimated */
  warning?: string;
}

/**
 * Aggregated totals with FX awareness.
 */
export interface FxAwareTotals {
  /** Total income in base currency */
  income: number;
  /** Total expenses in base currency */
  expenses: number;
  /** Net balance in base currency */
  balance: number;
  /** Number of transactions with missing conversion */
  unconvertedCount: number;
  /** Breakdown of unconverted amounts by currency */
  unconvertedByCurrency: Record<string, number>;
  /** List of currencies present in the data */
  currencies: string[];
  /** Whether totals are complete (no unconverted transactions) */
  isComplete: boolean;
}

/**
 * Currency precision configuration.
 */
export interface CurrencyPrecision {
  /** ISO 4217 currency code */
  code: string;
  /** Number of minor units (decimal places) */
  minorUnits: number;
}

/**
 * FX rate precision constant - store rates with 8 decimal places.
 */
export const FX_RATE_PRECISION = 8;

/**
 * Storage key for FX rate cache.
 */
export const FX_CACHE_STORAGE_KEY = 'xpensia_fx_cache_v1';

/**
 * Default cache expiry in hours (24 hours).
 */
export const FX_CACHE_EXPIRY_HOURS = 24;

/**
 * Currency minor units lookup for proper rounding.
 * Most currencies use 2 decimal places, but some are different.
 */
export const CURRENCY_MINOR_UNITS: Record<string, number> = {
  // 0 decimal places
  JPY: 0,
  KRW: 0,
  VND: 0,
  
  // 2 decimal places (default for most)
  USD: 2,
  EUR: 2,
  GBP: 2,
  SAR: 2,
  AED: 2,
  EGP: 2,
  CAD: 2,
  AUD: 2,
  CHF: 2,
  CNY: 2,
  INR: 2,
  
  // 3 decimal places
  BHD: 3,
  KWD: 3,
  OMR: 3,
  TND: 3,
  LYD: 3,
  JOD: 3,
};

/**
 * Get the number of minor units (decimal places) for a currency.
 * Defaults to 2 if currency not found.
 */
export const getMinorUnits = (currencyCode: string): number => {
  return CURRENCY_MINOR_UNITS[currencyCode.toUpperCase()] ?? 2;
};

/**
 * Round an amount to the appropriate precision for a currency.
 */
export const roundToCurrencyPrecision = (amount: number, currencyCode: string): number => {
  const minorUnits = getMinorUnits(currencyCode);
  const factor = Math.pow(10, minorUnits);
  return Math.round(amount * factor) / factor;
};

/**
 * Format an FX rate with full precision.
 */
export const formatFxRate = (rate: number): string => {
  return rate.toFixed(FX_RATE_PRECISION);
};

/**
 * Create the FX pair notation string.
 */
export const createFxPair = (fromCurrency: string, toCurrency: string): string => {
  return `${fromCurrency.toUpperCase()}->${toCurrency.toUpperCase()}`;
};
