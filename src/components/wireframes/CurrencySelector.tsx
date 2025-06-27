
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  darkMode?: boolean;
  currencies?: string[];
}

const CurrencySelector = ({ 
  value, 
  onChange, 
  className = '', 
  darkMode = false,
  currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AED', 'INR', 'CAD', 'AUD', 'CNY']
}: CurrencySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`rounded px-2 py-1 text-sm ${darkMode ? 'bg-blue-700 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300'} ${className} dark:bg-white dark:text-black`}
        aria-label="Select currency"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map(currency => (
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
