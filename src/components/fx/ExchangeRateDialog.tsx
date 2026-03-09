/**
 * @file ExchangeRateDialog.tsx
 * @description Dialog for adding or editing exchange rates.
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { getUserSettings } from '@/utils/storage-utils';
import { ExchangeRate } from '@/models/exchange-rate';
import { addExchangeRate, updateExchangeRate } from '@/services/ExchangeRateService';
import AddCurrencyDialog from '@/components/currency/AddCurrencyDialog';
import { formatCurrencyFlagCode, getAvailableCurrencies } from '@/lib/currency-utils';
import { toast } from '@/components/ui/use-toast';
import CurrencySelect from '@/components/currency/CurrencySelect';
import { useLanguage } from '@/i18n/LanguageContext';

interface ExchangeRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRate?: ExchangeRate;
  defaultFromCurrency?: string;
  onSave?: (rate: ExchangeRate) => void;
}

const ExchangeRateDialog: React.FC<ExchangeRateDialogProps> = ({
  open, onOpenChange, existingRate, defaultFromCurrency, onSave,
}) => {
  const { t } = useLanguage();
  const baseCurrency = getUserSettings()?.currency || 'SAR';

  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency || '');
  const [rate, setRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [addCurrencyOpen, setAddCurrencyOpen] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(() =>
    getAvailableCurrencies().filter((c) => c !== baseCurrency)
  );

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
      toast({ title: t('fx.selectCurrency'), variant: 'destructive' });
      return;
    }
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({ title: t('fx.invalidRate'), variant: 'destructive' });
      return;
    }
    if (!effectiveDate) {
      toast({ title: t('fx.selectDate'), variant: 'destructive' });
      return;
    }

    let savedRate: ExchangeRate;
    if (existingRate) {
      const updated = updateExchangeRate(existingRate.id, {
        rate: rateValue, effectiveDate, notes: notes.trim() || undefined,
      });
      if (!updated) {
        toast({ title: t('toast.couldNotUpdateRate'), description: t('toast.pleaseTryAgain'), variant: 'destructive' });
        return;
      }
      savedRate = updated;
      toast({ title: t('fx.rateUpdated'), description: '' });
    } else {
      savedRate = addExchangeRate(fromCurrency.toUpperCase(), baseCurrency, rateValue, effectiveDate, 'manual', notes.trim() || undefined);
      toast({ title: t('fx.rateUpdated'), description: '' });
    }

    onSave?.(savedRate);
    onOpenChange(false);
  };

  const isEditing = !!existingRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('fx.editRate') : t('fx.addRate')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="from-currency">{t('fx.fromCurrency')}</Label>
            {isEditing ? (
              <Input id="from-currency" value={formatCurrencyFlagCode(fromCurrency, '')} disabled className="bg-muted" />
            ) : (
              <div className="flex items-center gap-1">
                <CurrencySelect id="from-currency" value={fromCurrency} onChange={setFromCurrency} currencies={availableCurrencies} displayMode="codePlusCountry" />
                <Button type="button" variant="outline" size="icon" onClick={() => setAddCurrencyOpen(true)} title={t('fx.addNewCurrency')}>
                  <Plus className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-currency">{t('fx.toCurrencyBase')}</Label>
            <Input id="to-currency" value={formatCurrencyFlagCode(baseCurrency, '')} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">{t('fx.rate')} (1 {fromCurrency || '???'} = ? {baseCurrency})</Label>
            <Input id="rate" type="number" step="0.00000001" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder={t('fx.ratePlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effective-date">{t('fx.effectiveDate')}</Label>
            <Input id="effective-date" type="date" value={effectiveDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setEffectiveDate(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t('fx.effectiveDateHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('fx.notesOptional')}</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('fx.notesPlaceholder')} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave}>{isEditing ? t('fx.updateRate') : t('fx.addRateBtn')}</Button>
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
