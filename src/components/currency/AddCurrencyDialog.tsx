import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addCustomCurrency, CustomCurrency } from '@/lib/currency-utils';

interface AddCurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (currency: CustomCurrency) => void;
  inputClassName?: string;
}

const AddCurrencyDialog: React.FC<AddCurrencyDialogProps> = ({
  open,
  onOpenChange,
  onSaved,
  inputClassName,
}) => {
  const [newCurrency, setNewCurrency] = useState({ code: '', country: '', rate: '' });

  const handleSaveCurrency = () => {
    if (!newCurrency.code.trim() || !newCurrency.country.trim()) return;

    const savedCurrency: CustomCurrency = {
      code: newCurrency.code.trim().toUpperCase(),
      country: newCurrency.country.trim(),
      conversionRate: newCurrency.rate ? parseFloat(newCurrency.rate) : undefined,
      isCustom: true,
    };

    addCustomCurrency(savedCurrency);
    onSaved?.(savedCurrency);
    setNewCurrency({ code: '', country: '', rate: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Currency</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="new-currency-code">
              Short Name*
            </label>
            <Input
              id="new-currency-code"
              value={newCurrency.code}
              onChange={(e) => setNewCurrency((prev) => ({ ...prev, code: e.target.value }))}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="new-currency-country">
              Country*
            </label>
            <Input
              id="new-currency-country"
              value={newCurrency.country}
              onChange={(e) => setNewCurrency((prev) => ({ ...prev, country: e.target.value }))}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="new-currency-rate">
              Conversion Rate
            </label>
            <Input
              id="new-currency-rate"
              type="number"
              step="0.0001"
              value={newCurrency.rate}
              onChange={(e) => setNewCurrency((prev) => ({ ...prev, rate: e.target.value }))}
              className={inputClassName}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveCurrency}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCurrencyDialog;
