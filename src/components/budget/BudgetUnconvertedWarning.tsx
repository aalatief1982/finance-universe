/**
 * @file BudgetUnconvertedWarning.tsx
 * @description Warning component for budgets with unconverted multi-currency transactions
 *
 * @module components/budget/BudgetUnconvertedWarning
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/formatters';
import { BudgetProgress } from '@/models/budget-period';

interface BudgetUnconvertedWarningProps {
  progress: BudgetProgress;
  baseCurrency?: string;
  compact?: boolean;
}

const BudgetUnconvertedWarning: React.FC<BudgetUnconvertedWarningProps> = ({
  progress,
  baseCurrency = 'USD',
  compact = false,
}) => {
  if (progress.isFullyConverted !== false || !progress.unconvertedCount) {
    return null;
  }

  const { unconvertedCount, unconvertedCurrencies = [], unconvertedByNative = {} } = progress;

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-warning">
        <AlertTriangle size={12} />
        <span>{unconvertedCount} unconverted</span>
      </div>
    );
  }

  const currencyBreakdown = Object.entries(unconvertedByNative)
    .map(([currency, amount]) => `${formatCurrency(amount, currency)}`)
    .join(', ');

  return (
    <Alert variant="default" className="border-warning/50 bg-warning/5 py-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
        <AlertDescription className="text-xs text-muted-foreground">
          <span className="font-medium text-warning">
            {unconvertedCount} transaction{unconvertedCount > 1 ? 's' : ''}
          </span>
          {' '}in {unconvertedCurrencies.join(', ')} could not be converted to {baseCurrency}.
          {currencyBreakdown && (
            <span className="block mt-1">
              Unconverted total: {currencyBreakdown}
            </span>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default BudgetUnconvertedWarning;
