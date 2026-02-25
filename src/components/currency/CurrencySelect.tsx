import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from '@/components/ui/select';
import {
  CURRENCY_GROUP_LABELS,
  CURRENCY_GROUP_ORDER,
  CURRENCY_OPTION_MAP,
  CURRENCY_OPTIONS,
} from '@/constants/currencies';
import { SupportedCurrency } from '@/types/locale';

interface CurrencySelectProps {
  id?: string;
  value: SupportedCurrency;
  onValueChange: (value: SupportedCurrency) => void;
  placeholder?: string;
}

const CurrencyOptionDisplay = ({
  flag,
  code,
  name,
}: {
  flag: string;
  code: SupportedCurrency;
  name: string;
}) => (
  <span className="flex items-center gap-2">
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px]"
      aria-hidden="true"
    >
      {flag}
    </span>
    <span className="truncate">{code} {name}</span>
  </span>
);

export const CurrencySelect = ({
  id,
  value,
  onValueChange,
  placeholder = 'Select currency',
}: CurrencySelectProps) => {
  const selectedCurrency = CURRENCY_OPTION_MAP.get(value);

  return (
    <Select value={value} onValueChange={(newValue) => onValueChange(newValue as SupportedCurrency)}>
      <SelectTrigger id={id} className="w-full">
        {selectedCurrency ? (
          <CurrencyOptionDisplay
            flag={selectedCurrency.flag}
            code={selectedCurrency.code}
            name={selectedCurrency.name}
          />
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_GROUP_ORDER.map((group, index) => (
          <React.Fragment key={group}>
            <SelectGroup>
              <SelectLabel>{CURRENCY_GROUP_LABELS[group]}</SelectLabel>
              {CURRENCY_OPTIONS.filter((currency) => currency.group === group).map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <CurrencyOptionDisplay
                    flag={currency.flag}
                    code={currency.code}
                    name={currency.name}
                  />
                </SelectItem>
              ))}
            </SelectGroup>
            {index < CURRENCY_GROUP_ORDER.length - 1 ? <SelectSeparator /> : null}
          </React.Fragment>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelect;
