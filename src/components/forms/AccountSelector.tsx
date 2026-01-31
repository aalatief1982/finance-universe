/**
 * @file AccountSelector.tsx
 * @description UI component for AccountSelector.
 *
 * @module components/forms/AccountSelector
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues, ACCOUNTS } from './transaction-form-schema';

interface AccountSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
  isFromAccount: boolean;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  form,
  isFromAccount
}) => {
  const fieldName = isFromAccount ? "fromAccount" : "toAccount";
  const label = isFromAccount ? "From Account*" : "To Account*";

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value || ""}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${isFromAccount ? 'account' : 'destination account'}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {ACCOUNTS.map(account => (
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
