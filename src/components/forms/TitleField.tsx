/**
 * @file TitleField.tsx
 * @description UI component for TitleField.
 *
 * @module components/forms/TitleField
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
import { useLanguage } from '@/i18n/LanguageContext';

interface TitleFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

const TitleField: React.FC<TitleFieldProps> = ({
  form
}) => {
  const { t } = useLanguage();
  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem data-field="title">
          <FormLabel>Title*</FormLabel>
          <FormControl>
            <Input placeholder="Transaction title" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TitleField;
