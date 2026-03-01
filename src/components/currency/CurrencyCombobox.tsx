import React from 'react';
import CurrencySelect from '@/components/currency/CurrencySelect';

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
  searchAutoFocus,
  dropdownContentClassName,
  dropdownListClassName,
  openFocusTarget,
}) => {
  void searchAutoFocus;
  void dropdownContentClassName;
  void dropdownListClassName;
  void openFocusTarget;

  return (
    <CurrencySelect
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      triggerClassName={className}
      displayMode={displayMode}
    />
  );
};

export default CurrencyCombobox;
