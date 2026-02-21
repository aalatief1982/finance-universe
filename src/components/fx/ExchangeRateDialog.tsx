/**
 * @file ExchangeRateDialog.tsx
 * @description Dialog for adding or editing exchange rates.
 *
 * @module components/fx/ExchangeRateDialog
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { getUserSettings } from '@/utils/storage-utils';
import { ExchangeRate } from '@/models/exchange-rate';
import { addExchangeRate, updateExchangeRate } from '@/services/ExchangeRateService';
import AddCurrencyDialog from '@/components/currency/AddCurrencyDialog';
import { getAvailableCurrencies } from '@/lib/currency-utils';
import { toast } from '@/components/ui/use-toast';

interface ExchangeRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing rate to edit, or undefined for new rate */
  existingRate?: ExchangeRate;
  /** Pre-fill the fromCurrency field */
  defaultFromCurrency?: string;
  /** Called when rate is saved */
  onSave?: (rate: ExchangeRate) => void;
}

const ExchangeRateDialog: React.FC<ExchangeRateDialogProps> = ({
  open,
  onOpenChange,
  existingRate,
  defaultFromCurrency,
  onSave,
}) => {
  const baseCurrency = getUserSettings()?.currency || 'SAR';
  
  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency || '');
  const [rate, setRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [addCurrencyOpen, setAddCurrencyOpen] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(() =>
    getAvailableCurrencies().filter((c) => c !== baseCurrency)
  );

  // Reset form when dialog opens or existingRate changes
  useEffect(() => {
    if (open) {
      if (existingRate) {
        setFromCurrency(existingRate.fromCurrency);
        setRate(existingRate.rate.toString());
        setEffectiveDate(existingRate.effectiveDate);
        setNotes(existingRate.notes || '');
      } else {
        setFromCurrency(defaultFromCurrency || '');
        setRate('');
        setEffectiveDate(new Date().toISOString().split('T')[0]);
        setNotes('');
      }
    }
  }, [open, existingRate, defaultFromCurrency]);

  useEffect(() => {
    setAvailableCurrencies(getAvailableCurrencies().filter((c) => c !== baseCurrency));
  }, [baseCurrency, open]);

  const handleSave = () => {
    if (!fromCurrency.trim()) {
      toast({ title: 'Please select a currency', variant: 'destructive' });
      return;
    }
    
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({ title: 'Please enter a valid rate greater than 0', variant: 'destructive' });
      return;
    }

    if (!effectiveDate) {
      toast({ title: 'Please select an effective date', variant: 'destructive' });
      return;
    }

    let savedRate: ExchangeRate;
    
    if (existingRate) {
      const updated = updateExchangeRate(existingRate.id, {
        rate: rateValue,
        effectiveDate,
        notes: notes.trim() || undefined,
      });
      if (!updated) {
        toast({ title: 'Failed to update rate', variant: 'destructive' });
        return;
      }
      savedRate = updated;
      toast({ title: 'Exchange rate updated' });
    } else {
      savedRate = addExchangeRate(
        fromCurrency.toUpperCase(),
        baseCurrency,
        rateValue,
        effectiveDate,
        'manual',
        notes.trim() || undefined
      );
      toast({ title: 'Exchange rate added' });
    }

    onSave?.(savedRate);
    onOpenChange(false);
  };

  const isEditing = !!existingRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Exchange Rate' : 'Add Exchange Rate'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="from-currency">From Currency</Label>
            {isEditing ? (
              <Input
                id="from-currency"
                value={fromCurrency}
                disabled
                className="bg-muted"
              />
            ) : (
              <div className="flex items-center gap-1">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger id="from-currency" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAddCurrencyOpen(true)}
                  title="Add new currency"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-currency">To Currency (Base)</Label>
            <Input
              id="to-currency"
              value={baseCurrency}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">
              Rate (1 {fromCurrency || '???'} = ? {baseCurrency})
            </Label>
            <Input
              id="rate"
              type="number"
              step="0.00000001"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g., 3.75"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effective-date">Effective Date</Label>
            <Input
              id="effective-date"
              type="date"
              value={effectiveDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Rate applies to transactions on or after this date
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Bank transfer rate"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Update' : 'Add'} Rate
          </Button>
        </DialogFooter>
      </DialogContent>

      <AddCurrencyDialog
        open={addCurrencyOpen}
        onOpenChange={setAddCurrencyOpen}
        onSaved={(currency) => {
          const refreshed = getAvailableCurrencies().filter((c) => c !== baseCurrency);
          setAvailableCurrencies(refreshed);
          setFromCurrency(currency.code);
        }}
      />
    </Dialog>
  );
};

export default ExchangeRateDialog;
