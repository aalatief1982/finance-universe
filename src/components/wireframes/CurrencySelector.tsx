
import React from 'react';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  darkMode?: boolean;
}

const CurrencySelector = ({ value, onChange, className = '', darkMode = false }: CurrencySelectorProps) => {
  // List of common currencies
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AED', 'INR', 'CAD', 'AUD', 'CNY'];
  
  return (
    <select 
      className={`rounded px-2 py-1 text-sm ${
        darkMode 
          ? 'bg-blue-700 text-white border-blue-600' 
          : 'bg-white text-gray-800 border-gray-300'
      } ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select currency"
    >
      {currencies.map(currency => (
        <option key={currency} value={currency}>
          {currency}
        </option>
      ))}
    </select>
  );
};

export default CurrencySelector;
