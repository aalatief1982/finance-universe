/**
 * @file AmountField.tsx
 * @description UI component for AmountField.
 *
 * @module components/forms/AmountField
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
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';

interface AmountFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

const AmountField: React.FC<AmountFieldProps> = ({
  form
}) => {
  const amountError = form.formState.errors.amount;
  const amountValue = form.watch('amount');
  
  const getFieldState = () => {
    if (amountError) return 'error';
    if (amountValue && amountValue > 0) return 'success';
    return 'default';
  };

  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Amount*</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              state={getFieldState()}
              showStateIcon={true}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AmountField;
