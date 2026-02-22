/**
 * @file CurrencySelector.tsx
 * @description UI component for CurrencySelector.
 *
 * @module components/forms/CurrencySelector
 */

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues, CURRENCIES } from './transaction-form-schema';
import { cn } from '@/lib/utils';

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
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className={cn(fieldState.error && 'border-destructive')}>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CurrencySelector;
