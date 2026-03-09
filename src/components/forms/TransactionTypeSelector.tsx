/**
 * @file TransactionTypeSelector.tsx
 * @description UI component for TransactionTypeSelector.
 *
 * @module components/forms/TransactionTypeSelector
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

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';
import { getKeywordMatches, KeywordEntry } from '@/lib/smart-paste-engine/suggestionEngine';

interface TransactionTypeSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
}

const TransactionTypeSelector: React.FC<TransactionTypeSelectorProps> = ({
  form
}) => {
  const vendor = form.watch('vendor')
  const [matches, setMatches] = useState<KeywordEntry[]>([])

  // Note: form is excluded from deps to prevent render loops - we use form.getValues() inside
  useEffect(() => {
    if (vendor) {
      const m = getKeywordMatches(vendor as string)
      setMatches(m)
      const currentType = form.getValues().type
      if (m.length === 1 && currentType !== m[0].type) {
        form.setValue('type', m[0].type)
      }
    } else {
      setMatches([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor])
  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Transaction Type*</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          {matches.length > 1 && (
            <Select onValueChange={val => form.setValue('type', val)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose match" />
              </SelectTrigger>
              <SelectContent>
                {matches.map(m => (
                  <SelectItem key={m.keyword} value={m.type}>
                    {m.type} ({m.keyword})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TransactionTypeSelector;
