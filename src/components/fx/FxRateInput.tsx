/**
 * @file FxRateInput.tsx
 * @description Dialog component for manually entering exchange rates.
 *
 * @module components/fx/FxRateInput
 *
 * @responsibilities
 * 1. Allow user to input manual exchange rate
 * 2. Show conversion preview
 * 3. Validate rate input
 */

import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/format-utils';
import { roundToCurrencyPrecision } from '@/types/fx';

interface FxRateInputProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** The original amount */
  amount: number;
  /** Transaction currency (from) */
  fromCurrency: string;
  /** Base currency (to) */
  toCurrency: string;
  /** Callback when rate is confirmed */
  onConfirm: (rate: number) => void;
  /** Optional initial rate value */
  initialRate?: number;
}

const FxRateInput: React.FC<FxRateInputProps> = ({
  isOpen,
  onOpenChange,
  amount,
  fromCurrency,
  toCurrency,
  onConfirm,
  initialRate,
}) => {
  const [rateInput, setRateInput] = useState<string>(initialRate?.toString() || '');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  // Update converted amount when rate changes
  useEffect(() => {
    const rate = parseFloat(rateInput);
    if (!isNaN(rate) && rate > 0) {
      setConvertedAmount(roundToCurrencyPrecision(amount * rate, toCurrency));
    } else {
      setConvertedAmount(null);
    }
  }, [rateInput, amount, toCurrency]);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRateInput(initialRate?.toString() || '');
    }
  }, [isOpen, initialRate]);

  const handleConfirm = () => {
    const rate = parseFloat(rateInput);
    if (!isNaN(rate) && rate > 0) {
      onConfirm(rate);
      onOpenChange(false);
    }
  };

  const isValidRate = !isNaN(parseFloat(rateInput)) && parseFloat(rateInput) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator size={20} />
            Enter Exchange Rate
          </DialogTitle>
          <DialogDescription>
            Enter the rate for converting {fromCurrency} to {toCurrency}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Amount Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Original</span>
            <span className="font-medium">
              {formatCurrency(amount, fromCurrency)}
            </span>
          </div>

          {/* Rate Input */}
          <div className="space-y-2">
            <Label htmlFor="fx-rate">
              Rate (1 {fromCurrency} = ? {toCurrency})
            </Label>
            <Input
              id="fx-rate"
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="Enter rate..."
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Conversion Preview */}
          {convertedAmount !== null && (
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRight size={14} />
                <span>Converted</span>
              </div>
              <span className="font-semibold text-lg text-primary">
                {formatCurrency(convertedAmount, toCurrency)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValidRate}>
            Apply Rate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FxRateInput;
