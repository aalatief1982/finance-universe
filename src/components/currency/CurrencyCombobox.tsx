import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getAvailableCurrencyOptions, type AvailableCurrency } from '@/lib/currency-utils';

interface CurrencyComboboxProps {
  value?: string;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

const CurrencyCombobox: React.FC<CurrencyComboboxProps> = ({
  value,
  onChange,
  placeholder = 'Select currency',
  id,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [options, setOptions] = React.useState<AvailableCurrency[]>(() => getAvailableCurrencyOptions());

  React.useEffect(() => {
    if (!open) return;
    setOptions(getAvailableCurrencyOptions());
  }, [open]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? options.filter((currency) => {
      const searchable = `${currency.code} ${currency.name} ${currency.country}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    })
    : options;

  const selected = options.find((currency) => currency.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          {selected ? `${selected.flag} ${selected.code} — ${selected.name}` : placeholder}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by code, country, or currency"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code}-${currency.countryCode}`}
                  onSelect={() => {
                    onChange(currency.code);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === currency.code ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {currency.flag} {currency.code} — {currency.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CurrencyCombobox;
