/**
 * @file UnconvertedBadge.tsx
 * @description Badge component indicating a transaction lacks FX conversion.
 *
 * @module components/fx/UnconvertedBadge
 *
 * @responsibilities
 * 1. Display warning for unconverted transactions
 * 2. Show currency pair that needs conversion
 * 3. Optionally provide action to add manual rate
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UnconvertedBadgeProps {
  /** The currency that needs conversion */
  fromCurrency: string;
  /** The base currency to convert to */
  toCurrency: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Optional click handler for adding manual rate */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

const UnconvertedBadge: React.FC<UnconvertedBadgeProps> = ({
  fromCurrency,
  toCurrency,
  size = 'sm',
  onClick,
  className,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-warning/10 text-warning border-warning/30 gap-1 font-normal',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:bg-warning/20 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <AlertTriangle size={iconSize} />
      <span>
        {fromCurrency} → {toCurrency}
      </span>
    </Badge>
  );
};

export default UnconvertedBadge;
