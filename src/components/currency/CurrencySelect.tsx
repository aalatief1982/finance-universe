import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrencyFlagCode, getAvailableCurrencies, getCurrencyOptionByCode } from '@/lib/currency-utils';

interface CurrencySelectProps {
  value?: string;
  onChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  currencies?: string[];
  disabled?: boolean;
  displayMode?: 'codeOnly' | 'codePlusCountry';
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  id,
  placeholder = 'Select currency',
  className,
  triggerClassName,
  currencies,
  disabled,
  displayMode = 'codeOnly',
}) => {
  const options = React.useMemo(() => currencies ?? getAvailableCurrencies(), [currencies]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn('w-full min-w-0 font-normal', triggerClassName, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={className}>
        {options.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {displayMode === 'codePlusCountry'
              ? (() => {
                  const option = getCurrencyOptionByCode(currency);
                  return option
                    ? `${option.flag} ${option.code} - ${option.country}`
                    : formatCurrencyFlagCode(currency, currency);
                })()
              : formatCurrencyFlagCode(currency, currency)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelect;
