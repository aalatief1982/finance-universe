import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CURRENCIES } from '@/data/currencies';
import { addCustomCurrency, CustomCurrency } from '@/lib/currency-utils';
import { cn } from '@/lib/utils';

interface AddCurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (currency: CustomCurrency) => void;
  inputClassName?: string;
}

const countries = Array.from(
  new Map(
    CURRENCIES.map((currency) => [currency.countryCode, {
      country: currency.country,
      countryCode: currency.countryCode,
      flag: currency.flag,
      region: currency.region,
    }]),
  ).values(),
);

const AddCurrencyDialog: React.FC<AddCurrencyDialogProps> = ({
  open,
  onOpenChange,
  onSaved,
  inputClassName,
}) => {
  const [countryOpen, setCountryOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    country: '',
    countryCode: '',
    flag: '🏳️',
    region: 'MENA' as CustomCurrency['region'],
    rate: '',
  });

  const selectedCountry = useMemo(
    () => countries.find((country) => country.countryCode === newCurrency.countryCode),
    [newCurrency.countryCode],
  );

  const handleSaveCurrency = () => {
    if (!newCurrency.code.trim() || !newCurrency.country.trim()) return;

    const savedCurrency: CustomCurrency = {
      code: newCurrency.code.trim().toUpperCase(),
      name: newCurrency.name.trim() || `${newCurrency.country.trim()} Currency`,
      country: newCurrency.country.trim(),
      countryCode: newCurrency.countryCode || 'XX',
      flag: newCurrency.flag || '🏳️',
      region: newCurrency.region || 'MENA',
      conversionRate: newCurrency.rate ? parseFloat(newCurrency.rate) : undefined,
      isCustom: true,
    };

    addCustomCurrency(savedCurrency);
    onSaved?.(savedCurrency);
    setNewCurrency({
      code: '',
      name: '',
      country: '',
      countryCode: '',
      flag: '🏳️',
      region: 'MENA',
      rate: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
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
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="new-currency-name">
              Currency Name
            </label>
            <Input
              id="new-currency-name"
              value={newCurrency.name}
              onChange={(e) => setNewCurrency((prev) => ({ ...prev, name: e.target.value }))}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="new-currency-country">
              Country*
            </label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className={cn('w-full justify-between font-normal', inputClassName)}
                >
                  {selectedCountry
                    ? `${selectedCountry.flag} ${selectedCountry.country}`
                    : newCurrency.country
                      ? `${newCurrency.flag} ${newCurrency.country}`
                      : 'Select country'}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country" />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {countries.map((country) => (
                        <CommandItem
                          key={country.countryCode}
                          value={`${country.countryCode} ${country.country}`}
                          onSelect={() => {
                            setNewCurrency((prev) => ({
                              ...prev,
                              country: country.country,
                              countryCode: country.countryCode,
                              flag: country.flag,
                              region: country.region,
                            }));
                            setCountryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 size-4',
                              newCurrency.countryCode === country.countryCode ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {country.flag} {country.country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
