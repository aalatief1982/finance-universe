/**
 * @file CurrencySelector.tsx
 * @description UI component for CurrencySelector.
 *
 * @module components/forms/CurrencySelector
 */

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';
import { cn } from '@/lib/utils';
import CurrencyCombobox from '@/components/currency/CurrencyCombobox';

interface CurrencySelectorProps {
  form: UseFormReturn<TransactionFormValues>;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="currency"
      render={({ field, fieldState }) => (
        <FormItem data-field="currency">
          <FormLabel>Currency*</FormLabel>
          <FormControl>
            <CurrencyCombobox
              value={field.value}
              onChange={field.onChange}
              displayMode="codeOnly"
              className={cn(fieldState.error && 'border-destructive')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CurrencySelector;
