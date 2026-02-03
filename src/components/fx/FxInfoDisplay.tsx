/**
 * @file FxInfoDisplay.tsx
 * @description Display saved FX metadata for a transaction.
 *
 * @module components/fx/FxInfoDisplay
 *
 * @responsibilities
 * 1. Show saved exchange rate and conversion details
 * 2. Display rate source and lock timestamp
 * 3. Handle unconverted transactions with warning
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowRightLeft, Clock, Database, Edit3, Calculator } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/format-utils';
import { cn } from '@/lib/utils';
import UnconvertedBadge from './UnconvertedBadge';

interface FxInfoDisplayProps {
  /** Transaction with FX fields */
  transaction: Transaction;
  /** Callback when user wants to edit the rate */
  onEditRate?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

const FxInfoDisplay: React.FC<FxInfoDisplayProps> = ({
  transaction,
  onEditRate,
  size = 'sm',
  className,
}) => {
  const {
    currency,
    baseCurrency,
    amountInBase,
    fxRateToBase,
    fxSource,
    fxLockedAt,
    amount,
  } = transaction;

  // Same currency - no conversion needed
  if (!baseCurrency || currency?.toUpperCase() === baseCurrency?.toUpperCase()) {
    return null;
  }

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 12 : 14;

  // Unconverted transaction
  if (amountInBase === null || amountInBase === undefined || fxRateToBase === null || fxRateToBase === undefined) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <UnconvertedBadge
          fromCurrency={currency || 'USD'}
          toCurrency={baseCurrency}
          size={size}
          onClick={onEditRate}
        />
        {onEditRate && (
          <button
            type="button"
            onClick={onEditRate}
            className={cn('text-primary hover:underline flex items-center gap-1', textSize)}
          >
            <Edit3 size={iconSize} />
            Add rate
          </button>
        )}
      </div>
    );
  }

  // Source label and icon
  const sourceInfo = {
    identity: { label: '', icon: null },
    cached: { label: 'Cached', icon: Database },
    api: { label: 'Live', icon: ArrowRightLeft },
    manual: { label: 'Manual', icon: Calculator },
    missing: { label: '', icon: null },
  }[fxSource || 'cached'];

  const SourceIcon = sourceInfo.icon;

  // Format lock timestamp
  const formattedLockTime = fxLockedAt 
    ? format(parseISO(fxLockedAt), 'MMM d, yyyy h:mm a')
    : null;

  return (
    <div className={cn('space-y-1 text-muted-foreground', textSize, className)}>
      {/* Converted amount */}
      <div className="flex items-center gap-1.5">
        <ArrowRightLeft size={iconSize} className="text-muted-foreground/50" />
        <span className="font-medium text-foreground">
          {formatCurrency(amountInBase, baseCurrency)}
        </span>
        <span className="text-muted-foreground/70">
          @ {fxRateToBase?.toFixed(4)}
        </span>
      </div>

      {/* Source and timestamp */}
      <div className="flex items-center gap-3 pl-5">
        {sourceInfo.label && SourceIcon && (
          <span className="flex items-center gap-1">
            <SourceIcon size={iconSize - 2} />
            {sourceInfo.label}
          </span>
        )}
        {formattedLockTime && (
          <span className="flex items-center gap-1">
            <Clock size={iconSize - 2} />
            {formattedLockTime}
          </span>
        )}
      </div>
    </div>
  );
};

export default FxInfoDisplay;
