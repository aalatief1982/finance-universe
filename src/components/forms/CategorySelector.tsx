/**
 * @file CategorySelector.tsx
 * @description UI component for CategorySelector.
 *
 * @module components/forms/CategorySelector
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
import { TransactionFormValues } from './transaction-form-schema';
import { TransactionType } from '@/types/transaction';
import { getCategoriesForType } from '@/lib/categories-data';

interface CategorySelectorProps {
  form: UseFormReturn<TransactionFormValues>;
  transactionType: TransactionType;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  form,
  transactionType
}) => {
  // Get available categories for the current transaction type
  const categoriesForType = getCategoriesForType(transactionType);
  
  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category*</FormLabel>
          <Select
            value={field.value || ""}
            onValueChange={(value) => {
              field.onChange(value);
              // Reset subcategory when category changes
              form.setValue("subcategory", "none");
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-[300px]">
              {categoriesForType.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
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

export default CategorySelector;
