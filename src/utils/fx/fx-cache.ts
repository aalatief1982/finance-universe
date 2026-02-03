/**
 * @file fx-cache.ts
 * @description Local storage cache for FX rates, enabling offline-first operation.
 *
 * @module utils/fx/fx-cache
 *
 * @responsibilities
 * 1. Store and retrieve FX rates with date-based keys
 * 2. Handle cache expiry and cleanup
 * 3. Provide rate lookup with source tracking
 *
 * @storage-keys
 * - xpensia_fx_cache_v1: FX rate cache
 *
 * @review-tags
 * - @side-effects: writes to localStorage
 * - @offline: designed for offline-first operation
 */

import { safeStorage } from '@/utils/safe-storage';
import {
  FxRateCache,
  CachedFxRate,
  FxRateLookupResult,
  FX_CACHE_STORAGE_KEY,
  FX_CACHE_EXPIRY_HOURS,
  FX_RATE_PRECISION,
} from '@/types/fx';

/**
 * Get the current FX rate cache from storage.
 */
const getCache = (): FxRateCache => {
  try {
    const stored = safeStorage.getItem(FX_CACHE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[FxCache] Failed to parse cache:', error);
  }
  return { rates: {}, lastUpdated: new Date().toISOString() };
};

/**
 * Save the FX rate cache to storage.
 */
const saveCache = (cache: FxRateCache): void => {
  try {
    cache.lastUpdated = new Date().toISOString();
    safeStorage.setItem(FX_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[FxCache] Failed to save cache:', error);
  }
};

/**
 * Generate the cache key for a rate lookup.
 * Format: "YYYY-MM-DD:FROM:TO"
 */
export const createRateKey = (date: string, fromCurrency: string, toCurrency: string): string => {
  // Normalize date to YYYY-MM-DD format
  const dateOnly = date.split('T')[0];
  return `${dateOnly}:${fromCurrency.toUpperCase()}:${toCurrency.toUpperCase()}`;
};

/**
 * Get a cached exchange rate for a specific date and currency pair.
 * Returns null if not found or expired.
 */
export const getCachedRate = (
  date: string,
  fromCurrency: string,
  toCurrency: string
): FxRateLookupResult => {
  // Same currency - no conversion needed
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return {
      rate: 1,
      source: 'identity',
      lockedAt: new Date().toISOString(),
    };
  }

  const cache = getCache();
  const key = createRateKey(date, fromCurrency, toCurrency);
  const entry = cache.rates[key];

  if (!entry) {
    // Try reverse lookup
    const reverseKey = createRateKey(date, toCurrency, fromCurrency);
    const reverseEntry = cache.rates[reverseKey];
    
    if (reverseEntry && new Date(reverseEntry.expiresAt) > new Date()) {
      return {
        rate: parseFloat((1 / reverseEntry.rate).toFixed(FX_RATE_PRECISION)),
        source: 'cached',
        provider: reverseEntry.provider,
        lockedAt: new Date().toISOString(),
      };
    }
    
    return { rate: null, source: 'missing' };
  }

  // Check if rate is expired
  if (new Date(entry.expiresAt) <= new Date()) {
    return { rate: null, source: 'missing' };
  }

  return {
    rate: entry.rate,
    source: 'cached',
    provider: entry.provider,
    lockedAt: new Date().toISOString(),
  };
};

/**
 * Store an exchange rate in the cache.
 */
export const setCachedRate = (
  date: string,
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  provider: CachedFxRate['provider'] = 'manual'
): void => {
  // Don't cache identity rates
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return;
  }

  const cache = getCache();
  const key = createRateKey(date, fromCurrency, toCurrency);
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + FX_CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

  cache.rates[key] = {
    rate: parseFloat(rate.toFixed(FX_RATE_PRECISION)),
    provider,
    fetchedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  saveCache(cache);
};

/**
 * Set a manual exchange rate (convenience wrapper).
 */
export const setManualRate = (
  date: string,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): void => {
  setCachedRate(date, fromCurrency, toCurrency, rate, 'manual');
};

/**
 * Remove expired rates from the cache.
 * Should be called on app startup.
 */
export const cleanExpiredRates = (): number => {
  const cache = getCache();
  const now = new Date();
  let removedCount = 0;

  Object.keys(cache.rates).forEach((key) => {
    if (new Date(cache.rates[key].expiresAt) <= now) {
      delete cache.rates[key];
      removedCount++;
    }
  });

  if (removedCount > 0) {
    saveCache(cache);
    if (import.meta.env.MODE === 'development') {
      console.log(`[FxCache] Cleaned ${removedCount} expired rates`);
    }
  }

  return removedCount;
};

/**
 * Get all cached rates (for debugging/display purposes).
 */
export const getAllCachedRates = (): Record<string, CachedFxRate> => {
  return getCache().rates;
};

/**
 * Clear the entire FX cache.
 */
export const clearFxCache = (): void => {
  safeStorage.removeItem(FX_CACHE_STORAGE_KEY);
};

/**
 * Get the rate for today (convenience function).
 */
export const getTodayRate = (
  fromCurrency: string,
  toCurrency: string
): FxRateLookupResult => {
  return getCachedRate(new Date().toISOString(), fromCurrency, toCurrency);
};

/**
 * Check if a rate exists for a given date and currency pair.
 */
export const hasRate = (
  date: string,
  fromCurrency: string,
  toCurrency: string
): boolean => {
  const result = getCachedRate(date, fromCurrency, toCurrency);
  return result.rate !== null;
};

/**
 * Get cache statistics for debugging.
 */
export const getCacheStats = (): {
  totalRates: number;
  expiredCount: number;
  oldestRate: string | null;
  newestRate: string | null;
} => {
  const cache = getCache();
  const now = new Date();
  const rates = Object.values(cache.rates);
  
  let expiredCount = 0;
  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;

  rates.forEach((rate) => {
    const fetchedAt = new Date(rate.fetchedAt);
    
    if (new Date(rate.expiresAt) <= now) {
      expiredCount++;
    }
    
    if (!oldestDate || fetchedAt < oldestDate) {
      oldestDate = fetchedAt;
    }
    if (!newestDate || fetchedAt > newestDate) {
      newestDate = fetchedAt;
    }
  });

  return {
    totalRates: rates.length,
    expiredCount,
    oldestRate: oldestDate?.toISOString() || null,
    newestRate: newestDate?.toISOString() || null,
  };
};
