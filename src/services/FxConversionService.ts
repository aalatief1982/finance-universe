/**
 * @file FxConversionService.ts
 * @description Core FX conversion service for applying exchange rates to transactions.
 *
 * @module services/FxConversionService
 *
 * @responsibilities
 * 1. Apply FX conversion at transaction save time
 * 2. Determine appropriate rate source (identity, cached, manual, missing)
 * 3. Handle offline scenarios gracefully
 * 4. Round amounts to currency-appropriate precision
 *
 * @dependencies
 * - fx-cache.ts: Rate storage and lookup
 * - fx.ts: Type definitions and constants
 *
 * @review-tags
 * - @risk: Rate lookup order and fallback behavior
 * - @invariant: Historical transactions must use locked rates, never recalculated
 */

import { getUserSettings } from '@/utils/storage-utils';
import {
  FxSource,
  FxFallbackMode,
  TransactionFxFields,
  FxConversionResult,
  FxAwareTotals,
  roundToCurrencyPrecision,
  createFxPair,
} from '@/types/fx';
import { getCachedRate, setCachedRate } from '@/utils/fx/fx-cache';
import { getRate as getPermanentRate } from '@/services/ExchangeRateService';

/**
 * Default FX preferences when not configured.
 */
const DEFAULT_FX_PREFERENCES = {
  fallbackMode: 'allowMissing' as FxFallbackMode,
  showUnconvertedWarning: true,
};

/**
 * Get the user's base currency from settings.
 * Defaults to 'SAR' if not set.
 */
export const getBaseCurrency = (): string => {
  const settings = getUserSettings();
  return settings?.currency || 'SAR';
};

/**
 * Get the user's FX preferences.
 */
export const getFxPreferences = (): { fallbackMode: FxFallbackMode; showUnconvertedWarning: boolean } => {
  const settings = getUserSettings();
  const fxPrefs = settings?.fx || DEFAULT_FX_PREFERENCES;
  return {
    fallbackMode: fxPrefs.fallbackMode || DEFAULT_FX_PREFERENCES.fallbackMode,
    showUnconvertedWarning: fxPrefs.showUnconvertedWarning ?? DEFAULT_FX_PREFERENCES.showUnconvertedWarning,
  };
};

/**
 * Apply FX conversion to a transaction amount.
 * This is the CORE conversion algorithm called at transaction save time.
 *
 * @param amount - The transaction amount in original currency
 * @param transactionCurrency - The currency of the transaction (ISO 4217)
 * @param transactionDate - The date of the transaction (for rate lookup)
 * @param manualRate - Optional manually provided rate
 * @returns FxConversionResult with fields to apply to transaction
 *
 * @review-focus
 * - Rate is locked at save time and NEVER recalculated automatically
 * - Offline mode allows saving with null conversion values
 */
export const applyFxConversion = (
  amount: number,
  transactionCurrency: string,
  transactionDate: string,
  manualRate?: number
): FxConversionResult => {
  const baseCurrency = getBaseCurrency();
  const now = new Date().toISOString();

  // STEP 1: Same currency - no conversion needed (identity)
  if (transactionCurrency.toUpperCase() === baseCurrency.toUpperCase()) {
    const fields: TransactionFxFields = {
      currency: transactionCurrency.toUpperCase(),
      baseCurrency: baseCurrency.toUpperCase(),
      amountInBase: roundToCurrencyPrecision(amount, baseCurrency),
      fxRateToBase: 1,
      fxSource: 'identity',
      fxLockedAt: now,
      fxPair: null, // No pair for identity conversion
    };

    return { success: true, fields };
  }

  // STEP 2: Manual rate provided
  if (manualRate !== undefined && manualRate > 0) {
    const convertedAmount = amount * manualRate;
    const fields: TransactionFxFields = {
      currency: transactionCurrency.toUpperCase(),
      baseCurrency: baseCurrency.toUpperCase(),
      amountInBase: roundToCurrencyPrecision(convertedAmount, baseCurrency),
      fxRateToBase: manualRate,
      fxSource: 'manual',
      fxLockedAt: now,
      fxPair: createFxPair(transactionCurrency, baseCurrency),
    };

    // Cache the manual rate for future use
    setCachedRate(transactionDate, transactionCurrency, baseCurrency, manualRate, 'manual');

    return { success: true, fields };
  }

  // STEP 3: Check permanent ExchangeRateService first
  const permanentResult = getPermanentRate(transactionCurrency, baseCurrency, transactionDate);
  
  if (permanentResult !== null) {
    const convertedAmount = amount * permanentResult.rate;
    const fields: TransactionFxFields = {
      currency: transactionCurrency.toUpperCase(),
      baseCurrency: baseCurrency.toUpperCase(),
      amountInBase: roundToCurrencyPrecision(convertedAmount, baseCurrency),
      fxRateToBase: permanentResult.rate,
      fxSource: permanentResult.source === 'manual' ? 'manual' : 'cached',
      fxLockedAt: now,
      fxPair: createFxPair(transactionCurrency, baseCurrency),
    };

    return { success: true, fields };
  }

  // STEP 4: Check temporary cache for rate (fallback)
  const cachedResult = getCachedRate(transactionDate, transactionCurrency, baseCurrency);

  if (cachedResult.rate !== null && cachedResult.source !== 'missing') {
    const convertedAmount = amount * cachedResult.rate;
    const fields: TransactionFxFields = {
      currency: transactionCurrency.toUpperCase(),
      baseCurrency: baseCurrency.toUpperCase(),
      amountInBase: roundToCurrencyPrecision(convertedAmount, baseCurrency),
      fxRateToBase: cachedResult.rate,
      fxSource: cachedResult.source,
      fxLockedAt: now,
      fxPair: createFxPair(transactionCurrency, baseCurrency),
    };

    return { success: true, fields };
  }

  // STEP 5: No rate available - handle based on user preference
  const { fallbackMode } = getFxPreferences();

  // For 'allowMissing' mode, save with null values
  if (fallbackMode === 'allowMissing') {
    const fields: TransactionFxFields = {
      currency: transactionCurrency.toUpperCase(),
      baseCurrency: baseCurrency.toUpperCase(),
      amountInBase: null,
      fxRateToBase: null,
      fxSource: 'missing',
      fxLockedAt: null,
      fxPair: createFxPair(transactionCurrency, baseCurrency),
    };

    return {
      success: true,
      fields,
      warning: `No exchange rate available for ${transactionCurrency} → ${baseCurrency}. Transaction saved without conversion.`,
    };
  }

  // For 'manual' or 'cachedOnly' mode, indicate rate is needed
  const fields: TransactionFxFields = {
    currency: transactionCurrency.toUpperCase(),
    baseCurrency: baseCurrency.toUpperCase(),
    amountInBase: null,
    fxRateToBase: null,
    fxSource: 'missing',
    fxLockedAt: null,
    fxPair: createFxPair(transactionCurrency, baseCurrency),
  };

  return {
    success: false,
    fields,
    warning: fallbackMode === 'manual'
      ? `Please enter exchange rate for ${transactionCurrency} → ${baseCurrency}`
      : `No cached rate available for ${transactionCurrency} → ${baseCurrency}. Cannot save transaction.`,
  };
};

/**
 * Calculate FX-aware totals from an array of transactions.
 * Separates converted and unconverted transactions.
 *
 * @param transactions - Array of transactions with FX fields
 * @returns FxAwareTotals with income, expenses, and unconverted breakdown
 */
export const calculateFxAwareTotals = (
  transactions: Array<{
    amount: number;
    amountInBase?: number | null;
    currency?: string;
    type: 'income' | 'expense' | 'transfer';
  }>
): FxAwareTotals => {
  let income = 0;
  let expenses = 0;
  let unconvertedCount = 0;
  const unconvertedByCurrency: Record<string, number> = {};
  const currencies = new Set<string>();

  transactions.forEach((tx) => {
    // Skip transfers for totals
    if (tx.type === 'transfer') return;

    const currency = tx.currency?.toUpperCase() || 'USD';
    currencies.add(currency);

    // Check if transaction is converted
    if (tx.amountInBase != null) {
      if (tx.type === 'income') {
        income += Math.abs(tx.amountInBase);
      } else {
        expenses += Math.abs(tx.amountInBase);
      }
    } else {
      // Unconverted transaction
      unconvertedCount++;
      unconvertedByCurrency[currency] = (unconvertedByCurrency[currency] || 0) + Math.abs(tx.amount);
    }
  });

  return {
    income: roundToCurrencyPrecision(income, getBaseCurrency()),
    expenses: roundToCurrencyPrecision(expenses, getBaseCurrency()),
    balance: roundToCurrencyPrecision(income - expenses, getBaseCurrency()),
    unconvertedCount,
    unconvertedByCurrency,
    currencies: Array.from(currencies),
    isComplete: unconvertedCount === 0,
  };
};

/**
 * Check if a transaction needs FX conversion (currency differs from base).
 */
export const needsConversion = (transactionCurrency: string): boolean => {
  return transactionCurrency.toUpperCase() !== getBaseCurrency().toUpperCase();
};

/**
 * Recalculate FX for a transaction using the latest available rate.
 * Use this sparingly - only when user explicitly requests recalculation.
 *
 * @param amount - Original transaction amount
 * @param currency - Transaction currency
 * @param date - Transaction date for rate lookup
 * @returns Updated FX fields or null if no rate available
 */
export const recalculateFx = (
  amount: number,
  currency: string,
  date: string
): TransactionFxFields | null => {
  const baseCurrency = getBaseCurrency();

  if (currency.toUpperCase() === baseCurrency.toUpperCase()) {
    return {
      currency: currency.toUpperCase(),
      baseCurrency: baseCurrency.toUpperCase(),
      amountInBase: amount,
      fxRateToBase: 1,
      fxSource: 'identity',
      fxLockedAt: new Date().toISOString(),
      fxPair: null,
    };
  }

  const rateResult = getCachedRate(date, currency, baseCurrency);

  if (rateResult.rate === null) {
    return null; // Still no rate available
  }

  const convertedAmount = amount * rateResult.rate;

  return {
    currency: currency.toUpperCase(),
    baseCurrency: baseCurrency.toUpperCase(),
    amountInBase: roundToCurrencyPrecision(convertedAmount, baseCurrency),
    fxRateToBase: rateResult.rate,
    fxSource: 'cached',
    fxLockedAt: new Date().toISOString(),
    fxPair: createFxPair(currency, baseCurrency),
  };
};

/**
 * Get a display-friendly description of the FX source.
 */
export const getFxSourceLabel = (source: FxSource): string => {
  switch (source) {
    case 'identity':
      return 'Same currency';
    case 'cached':
      return 'Cached rate';
    case 'api':
      return 'Live rate';
    case 'manual':
      return 'Manual rate';
    case 'missing':
      return 'Not converted';
    default:
      return 'Unknown';
  }
};
