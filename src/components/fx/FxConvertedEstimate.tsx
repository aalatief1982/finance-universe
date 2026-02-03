/**
 * @file FxConvertedEstimate.tsx
 * @description Component showing estimated converted amount in base currency.
 *
 * @module components/fx/FxConvertedEstimate
 *
 * @responsibilities
 * 1. Display converted amount estimate in base currency
 * 2. Show rate source indicator (cached, manual)
 * 3. Handle missing rate gracefully
 */

import React from 'react';
import { ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol, formatCurrency } from '@/utils/format-utils';
import { FxSource } from '@/types/fx';

interface FxConvertedEstimateProps {
  /** Original amount in transaction currency */
  originalAmount: number;
  /** Transaction currency (ISO 4217) */
  fromCurrency: string;
  /** Base currency to convert to */
  toCurrency: string;
  /** Converted amount (null if no rate available) */
  convertedAmount: number | null;
  /** Exchange rate used */
  rate: number | null;
  /** Source of the rate */
  source: FxSource;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

const FxConvertedEstimate: React.FC<FxConvertedEstimateProps> = ({
  originalAmount,
  fromCurrency,
  toCurrency,
  convertedAmount,
  rate,
  source,
  size = 'sm',
  className,
}) => {
  // Same currency - no conversion display needed
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return null;
  }

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 12 : 14;

  // No rate available
  if (convertedAmount === null || rate === null) {
    return (
      <div className={cn('flex items-center gap-1 text-warning', textSize, className)}>
        <AlertCircle size={iconSize} />
        <span>No rate for {fromCurrency} → {toCurrency}</span>
      </div>
    );
  }

  const sourceLabel = {
    identity: '',
    cached: 'cached',
    api: 'live',
    manual: 'manual',
    missing: '',
  }[source];

  return (
    <div className={cn('flex items-center gap-1.5 text-muted-foreground', textSize, className)}>
      <ArrowRight size={iconSize} className="text-muted-foreground/50" />
      <span className="font-medium text-foreground">
        {formatCurrency(convertedAmount, toCurrency)}
      </span>
      {sourceLabel && (
        <span className="text-muted-foreground/70">
          ({sourceLabel} @ {rate.toFixed(4)})
        </span>
      )}
    </div>
  );
};

export default FxConvertedEstimate;
