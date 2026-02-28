import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrencyFlagCode, getAvailableCurrencies } from '@/lib/currency-utils';

interface CurrencySelectProps {
  value?: string;
  onChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  currencies?: string[];
  disabled?: boolean;
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
            {formatCurrencyFlagCode(currency, currency)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelect;
