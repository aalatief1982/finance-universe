/**
 * @file AccountSelector.tsx
 * @description UI component for AccountSelector.
 *
 * @module components/forms/AccountSelector
 */

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues, ACCOUNTS } from './transaction-form-schema';
import { cn } from '@/lib/utils';

interface AccountSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
  isFromAccount: boolean;
  isRequired?: boolean;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ form, isFromAccount, isRequired = false }) => {
  const fieldName = isFromAccount ? 'fromAccount' : 'toAccount';
  const label = `${isFromAccount ? 'From Account' : 'To Account'}${isRequired ? '*' : ''}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <FormItem data-field={fieldName}>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value || ''} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className={cn(fieldState.error && 'border-destructive')}>
                <SelectValue placeholder={`Select ${isFromAccount ? 'account' : 'destination account'}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {ACCOUNTS.map((account) => (
                <SelectItem key={account} value={account}>
                  {account}
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

export default AccountSelector;
