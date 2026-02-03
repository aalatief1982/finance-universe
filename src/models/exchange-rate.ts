/**
 * @file exchange-rate.ts
 * @description Exchange rate data model for permanent storage.
 *
 * @module models/exchange-rate
 *
 * @responsibilities
 * 1. Define ExchangeRate interface structure
 * 2. Provide storage key constant
 */

/**
 * A permanently stored exchange rate entry.
 * Date-tracked to allow historical lookups without affecting past transactions.
 */
export interface ExchangeRate {
  /** Unique identifier */
  id: string;
  /** Source currency code (e.g., "USD") */
  fromCurrency: string;
  /** Target currency code - typically the user's base currency (e.g., "SAR") */
  toCurrency: string;
  /** Exchange rate (fromCurrency -> toCurrency) */
  rate: number;
  /** Date when this rate becomes effective (YYYY-MM-DD) */
  effectiveDate: string;
  /** When the rate was created (ISO timestamp) */
  createdAt: string;
  /** When the rate was last updated (ISO timestamp) */
  updatedAt: string;
  /** Source of the rate entry */
  source: 'manual' | 'import';
  /** Optional notes */
  notes?: string;
}

/**
 * Storage key for exchange rates.
 */
export const EXCHANGE_RATES_STORAGE_KEY = 'xpensia_exchange_rates_v1';
