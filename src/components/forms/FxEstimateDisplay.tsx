/**
 * @file FxEstimateDisplay.tsx
 * @description Inline display showing converted amount estimate below amount/currency fields.
 *
 * @module components/forms/FxEstimateDisplay
 *
 * @responsibilities
 * 1. Show converted amount estimate when currency differs from base
 * 2. Display warning when no rate available
 * 3. Provide link to enter manual rate
 */

import React from 'react';
import { useFxEstimate } from '@/hooks/useFxEstimate';
import { FxConvertedEstimate, UnconvertedBadge } from '@/components/fx';

interface FxEstimateDisplayProps {
  /** Transaction amount */
  amount: number | undefined;
  /** Transaction currency */
  currency: string | undefined;
  /** Transaction date (for rate lookup) */
  date: string | undefined;
  /** Callback when user wants to enter manual rate */
  onRequestManualRate?: () => void;
}

const FxEstimateDisplay: React.FC<FxEstimateDisplayProps> = ({
  amount,
  currency,
  date,
  onRequestManualRate,
}) => {
  const fxEstimate = useFxEstimate(amount, currency, date);

  // Don't show anything if no conversion needed or no amount
  if (!fxEstimate.needsConversion || !amount || amount <= 0) {
    return null;
  }

  // Show unconverted badge if no rate available
  if (fxEstimate.convertedAmount === null) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <UnconvertedBadge
          fromCurrency={currency || 'USD'}
          toCurrency={fxEstimate.baseCurrency}
          size="sm"
          onClick={onRequestManualRate}
        />
        {onRequestManualRate && (
          <button
            type="button"
            onClick={onRequestManualRate}
            className="text-xs text-primary hover:underline"
          >
            Add rate
          </button>
        )}
      </div>
    );
  }

  // Show converted estimate
  return (
    <div className="mt-1">
      <FxConvertedEstimate
        originalAmount={amount}
        fromCurrency={currency || 'USD'}
        toCurrency={fxEstimate.baseCurrency}
        convertedAmount={fxEstimate.convertedAmount}
        rate={fxEstimate.rate}
        source={fxEstimate.source}
        size="sm"
      />
    </div>
  );
};

export default FxEstimateDisplay;
