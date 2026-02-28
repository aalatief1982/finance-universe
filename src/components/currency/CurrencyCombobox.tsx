import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatCurrencyFlagCode, getAvailableCurrencyOptions, type AvailableCurrency } from '@/lib/currency-utils';

interface CurrencyComboboxProps {
  value?: string;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  displayMode?: 'codeOnly' | 'codePlusCountry';
  searchAutoFocus?: boolean;
  dropdownContentClassName?: string;
  dropdownListClassName?: string;
  openFocusTarget?: 'search' | 'selectedItem';
}

const CurrencyCombobox: React.FC<CurrencyComboboxProps> = ({
  value,
  onChange,
  placeholder = 'Select currency',
  id,
  className,
  displayMode = 'codeOnly',
  searchAutoFocus = true,
  dropdownContentClassName,
  dropdownListClassName,
  openFocusTarget = 'search',
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [options, setOptions] = React.useState<AvailableCurrency[]>(() => getAvailableCurrencyOptions());
  const optionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    if (!open) return;
    setOptions(getAvailableCurrencyOptions());
  }, [open]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? options.filter((currency) => {
      const searchable = `${currency.code} ${currency.name}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    })
    : options;

  const selected = options.find((currency) => currency.code === value);

  React.useEffect(() => {
    if (!open || openFocusTarget !== 'selectedItem') return;

    const fallbackCode = filtered[0]?.code;
    const targetCode = value && optionRefs.current[value] ? value : fallbackCode;
    if (!targetCode) return;

    requestAnimationFrame(() => {
      const targetElement = optionRefs.current[targetCode];
      if (!targetElement) return;
      targetElement.focus();
      targetElement.scrollIntoView({ block: 'nearest' });
    });
  }, [filtered, open, openFocusTarget, value]);

  const renderOptionLabel = (currency: AvailableCurrency) => {
    if (displayMode === 'codePlusCountry') {
      return `${formatCurrencyFlagCode(currency.code)} • ${currency.name}`;
    }

    return formatCurrencyFlagCode(currency.code);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full min-w-0 justify-between font-normal', className)}
        >
          <span className="min-w-0 truncate text-left">
            {selected ? formatCurrencyFlagCode(selected.code) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[var(--radix-popover-trigger-width)] p-0', dropdownContentClassName)}
        align="start"
        onOpenAutoFocus={(event) => {
          if (openFocusTarget === 'selectedItem') {
            event.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by code or currency"
            value={search}
            onValueChange={setSearch}
            autoFocus={searchAutoFocus}
          />
          <CommandList className={dropdownListClassName}>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code}-${currency.countryCode}`}
                  ref={(element) => {
                    optionRefs.current[currency.code] = element;
                  }}
                  tabIndex={-1}
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
                  {renderOptionLabel(currency)}
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
