/**
 * @file ExchangeRateService.ts
 * @description Service for managing permanent exchange rate storage with CRUD operations.
 *
 * @module services/ExchangeRateService
 *
 * @responsibilities
 * 1. CRUD operations for exchange rates
 * 2. Date-tracked rate lookups (finds most recent rate effective on a date)
 * 3. Integration with FX cache for fallback
 *
 * @storage-keys
 * - xpensia_exchange_rates_v1: Permanent exchange rate store
 */

import { v4 as uuidv4 } from 'uuid';
import { safeStorage } from '@/utils/safe-storage';
import { ExchangeRate, EXCHANGE_RATES_STORAGE_KEY } from '@/models/exchange-rate';
import { FX_RATE_PRECISION } from '@/types/fx';

/**
 * Get all stored exchange rates.
 */
export const getAllExchangeRates = (): ExchangeRate[] => {
  try {
    const stored = safeStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[ExchangeRateService] Failed to load rates:', error);
  }
  return [];
};

/**
 * Save all exchange rates to storage.
 */
const saveAllRates = (rates: ExchangeRate[]): void => {
  try {
    safeStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(rates));
  } catch (error) {
    console.error('[ExchangeRateService] Failed to save rates:', error);
  }
};

/**
 * Add a new exchange rate.
 */
export const addExchangeRate = (
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  effectiveDate: string,
  source: ExchangeRate['source'] = 'manual',
  notes?: string
): ExchangeRate => {
  const now = new Date().toISOString();
  const newRate: ExchangeRate = {
    id: uuidv4(),
    fromCurrency: fromCurrency.toUpperCase(),
    toCurrency: toCurrency.toUpperCase(),
    rate: parseFloat(rate.toFixed(FX_RATE_PRECISION)),
    effectiveDate: effectiveDate.split('T')[0], // Normalize to date only
    createdAt: now,
    updatedAt: now,
    source,
    notes,
  };

  const rates = getAllExchangeRates();
  rates.push(newRate);
  saveAllRates(rates);

  return newRate;
};

/**
 * Update an existing exchange rate.
 */
export const updateExchangeRate = (
  id: string,
  updates: Partial<Pick<ExchangeRate, 'rate' | 'effectiveDate' | 'notes'>>
): ExchangeRate | null => {
  const rates = getAllExchangeRates();
  const index = rates.findIndex((r) => r.id === id);

  if (index === -1) return null;

  const updated: ExchangeRate = {
    ...rates[index],
    ...updates,
    rate: updates.rate !== undefined 
      ? parseFloat(updates.rate.toFixed(FX_RATE_PRECISION)) 
      : rates[index].rate,
    effectiveDate: updates.effectiveDate 
      ? updates.effectiveDate.split('T')[0] 
      : rates[index].effectiveDate,
    updatedAt: new Date().toISOString(),
  };

  rates[index] = updated;
  saveAllRates(rates);

  return updated;
};

/**
 * Delete an exchange rate by ID.
 */
export const deleteExchangeRate = (id: string): boolean => {
  const rates = getAllExchangeRates();
  const filtered = rates.filter((r) => r.id !== id);

  if (filtered.length === rates.length) return false;

  saveAllRates(filtered);
  return true;
};

/**
 * Get exchange rate for a currency pair on a specific date.
 * Uses date-tracked lookup: finds the most recent rate effective on or before the date.
 *
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param date - The date to find a rate for (YYYY-MM-DD or ISO timestamp)
 * @returns The rate and metadata, or null if not found
 */
export const getRate = (
  fromCurrency: string,
  toCurrency: string,
  date: string
): { rate: number; effectiveDate: string; source: ExchangeRate['source'] } | null => {
  const rates = getAllExchangeRates();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  const targetDate = date.split('T')[0];

  // Find all rates for this currency pair with effectiveDate <= targetDate
  const matchingRates = rates
    .filter(
      (r) =>
        r.fromCurrency === from &&
        r.toCurrency === to &&
        r.effectiveDate <= targetDate
    )
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (matchingRates.length > 0) {
    const best = matchingRates[0];
    return {
      rate: best.rate,
      effectiveDate: best.effectiveDate,
      source: best.source,
    };
  }

  // Try reverse lookup
  const reverseRates = rates
    .filter(
      (r) =>
        r.fromCurrency === to &&
        r.toCurrency === from &&
        r.effectiveDate <= targetDate
    )
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (reverseRates.length > 0) {
    const best = reverseRates[0];
    return {
      rate: parseFloat((1 / best.rate).toFixed(FX_RATE_PRECISION)),
      effectiveDate: best.effectiveDate,
      source: best.source,
    };
  }

  return null;
};

/**
 * Get the latest (most recent) exchange rate for a currency pair.
 */
export const getLatestRate = (
  fromCurrency: string,
  toCurrency: string
): { rate: number; effectiveDate: string } | null => {
  const rates = getAllExchangeRates();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const matchingRates = rates
    .filter((r) => r.fromCurrency === from && r.toCurrency === to)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (matchingRates.length > 0) {
    return {
      rate: matchingRates[0].rate,
      effectiveDate: matchingRates[0].effectiveDate,
    };
  }

  // Try reverse
  const reverseRates = rates
    .filter((r) => r.fromCurrency === to && r.toCurrency === from)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (reverseRates.length > 0) {
    return {
      rate: parseFloat((1 / reverseRates[0].rate).toFixed(FX_RATE_PRECISION)),
      effectiveDate: reverseRates[0].effectiveDate,
    };
  }

  return null;
};

/**
 * Get all rates for a specific currency pair.
 */
export const getRatesForPair = (
  fromCurrency: string,
  toCurrency: string
): ExchangeRate[] => {
  const rates = getAllExchangeRates();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  return rates
    .filter((r) => r.fromCurrency === from && r.toCurrency === to)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
};

/**
 * Get unique currency pairs that have stored rates.
 */
export const getUniqueCurrencyPairs = (): Array<{ from: string; to: string }> => {
  const rates = getAllExchangeRates();
  const pairs = new Map<string, { from: string; to: string }>();

  rates.forEach((r) => {
    const key = `${r.fromCurrency}:${r.toCurrency}`;
    if (!pairs.has(key)) {
      pairs.set(key, { from: r.fromCurrency, to: r.toCurrency });
    }
  });

  return Array.from(pairs.values());
};

/**
 * Check if a rate exists for a currency pair on a specific date.
 */
export const hasRateForDate = (
  fromCurrency: string,
  toCurrency: string,
  date: string
): boolean => {
  return getRate(fromCurrency, toCurrency, date) !== null;
};

/**
 * Add or update a rate for a currency pair and effective date.
 * If a rate already exists for the exact pair + date, it updates; otherwise adds.
 */
export const upsertRate = (
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  effectiveDate: string,
  source: ExchangeRate['source'] = 'manual',
  notes?: string
): ExchangeRate => {
  const rates = getAllExchangeRates();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  const dateOnly = effectiveDate.split('T')[0];

  const existingIndex = rates.findIndex(
    (r) =>
      r.fromCurrency === from &&
      r.toCurrency === to &&
      r.effectiveDate === dateOnly
  );

  if (existingIndex !== -1) {
    // Update existing
    const updated = updateExchangeRate(rates[existingIndex].id, {
      rate,
      notes,
    });
    return updated!;
  }

  // Add new
  return addExchangeRate(from, to, rate, dateOnly, source, notes);
};

export default {
  getAll: getAllExchangeRates,
  add: addExchangeRate,
  update: updateExchangeRate,
  delete: deleteExchangeRate,
  getRate,
  getLatestRate,
  getRatesForPair,
  getUniqueCurrencyPairs,
  hasRateForDate,
  upsertRate,
};
