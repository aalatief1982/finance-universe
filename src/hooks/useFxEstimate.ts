/**
 * @file useFxEstimate.ts
 * @description Hook for computing FX conversion estimates in transaction forms.
 *
 * @module hooks/useFxEstimate
 *
 * @responsibilities
 * 1. Compute converted amount estimate from amount/currency
 * 2. Lookup rates from cache
 * 3. Determine if conversion is needed
 */

import { useMemo } from 'react';
import { getBaseCurrency, needsConversion } from '@/services/FxConversionService';
import { getCachedRate } from '@/utils/fx/fx-cache';
import { getRate as getPermanentRate } from '@/services/ExchangeRateService';
import { roundToCurrencyPrecision, FxSource } from '@/types/fx';

export interface FxEstimate {
  /** Whether conversion is needed (currency differs from base) */
  needsConversion: boolean;
  /** The user's base currency */
  baseCurrency: string;
  /** Converted amount (null if no rate available) */
  convertedAmount: number | null;
  /** Exchange rate used */
  rate: number | null;
  /** Source of the rate */
  source: FxSource;
  /** Display pair string like "USD → SAR" */
  pairDisplay: string;
}

/**
 * Hook to compute FX estimate for a transaction in progress.
 *
 * @param amount - Transaction amount
 * @param currency - Transaction currency
 * @param date - Transaction date (for rate lookup)
 * @returns FxEstimate with conversion details
 */
export function useFxEstimate(
  amount: number | undefined,
  currency: string | undefined,
  date: string | undefined
): FxEstimate {
  return useMemo(() => {
    const baseCurrency = getBaseCurrency();
    const txCurrency = currency?.toUpperCase() || baseCurrency;
    const txDate = date || new Date().toISOString().split('T')[0];
    const txAmount = amount || 0;

    // Check if conversion is needed
    const conversionNeeded = needsConversion(txCurrency);

    if (!conversionNeeded) {
      return {
        needsConversion: false,
        baseCurrency,
        convertedAmount: txAmount,
        rate: 1,
        source: 'identity' as FxSource,
        pairDisplay: `${txCurrency} → ${baseCurrency}`,
      };
    }

    // First check permanent ExchangeRateService
    const permanentResult = getPermanentRate(txCurrency, baseCurrency, txDate);
    
    if (permanentResult !== null) {
      const converted = roundToCurrencyPrecision(txAmount * permanentResult.rate, baseCurrency);
      return {
        needsConversion: true,
        baseCurrency,
        convertedAmount: converted,
        rate: permanentResult.rate,
        source: permanentResult.source === 'manual' ? 'manual' as FxSource : 'cached' as FxSource,
        pairDisplay: `${txCurrency} → ${baseCurrency}`,
      };
    }

    // Fallback to cache lookup
    const rateResult = getCachedRate(txDate, txCurrency, baseCurrency);

    if (rateResult.rate !== null) {
      const converted = roundToCurrencyPrecision(txAmount * rateResult.rate, baseCurrency);
      return {
        needsConversion: true,
        baseCurrency,
        convertedAmount: converted,
        rate: rateResult.rate,
        source: rateResult.source,
        pairDisplay: `${txCurrency} → ${baseCurrency}`,
      };
    }

    // No rate available
    return {
      needsConversion: true,
      baseCurrency,
      convertedAmount: null,
      rate: null,
      source: 'missing' as FxSource,
      pairDisplay: `${txCurrency} → ${baseCurrency}`,
    };
  }, [amount, currency, date]);
}

export default useFxEstimate;
