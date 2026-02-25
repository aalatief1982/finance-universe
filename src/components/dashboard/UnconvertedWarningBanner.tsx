/**
 * @file UnconvertedWarningBanner.tsx
 * @description Warning banner for unconverted multi-currency transactions
 *
 * @module components/dashboard/UnconvertedWarningBanner
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UnconvertedWarningBannerProps {
  unconvertedCount: number;
  unconvertedCurrencies: string[];
  onDismiss?: () => void;
}

const UnconvertedWarningBanner: React.FC<UnconvertedWarningBannerProps> = ({
  unconvertedCount,
  unconvertedCurrencies,
  onDismiss,
}) => {
  const navigate = useNavigate();

  if (unconvertedCount === 0) return null;

  const currencyList = unconvertedCurrencies.slice(0, 3).join(', ');
  const hasMore = unconvertedCurrencies.length > 3;

  return (
    <Alert variant="default" className="mb-4 border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning font-medium">
        {unconvertedCount} transaction{unconvertedCount > 1 ? 's' : ''} missing exchange rate
      </AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        <p>
          Transactions in {currencyList}{hasMore ? ` and ${unconvertedCurrencies.length - 3} more` : ''} 
          {' '}could not be converted to your default currency. Totals may be incomplete.
        </p>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/transactions?filter=unconverted')}
          >
            Review Transactions
          </Button>
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default UnconvertedWarningBanner;
