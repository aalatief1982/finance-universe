/**
 * @file CategorySelector.tsx
 * @description UI component for CategorySelector.
 */

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';
import { TransactionType } from '@/types/transaction';
import { getCategoriesForType } from '@/lib/categories-data';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface CategorySelectorProps {
  form: UseFormReturn<TransactionFormValues>;
  transactionType: TransactionType;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ form, transactionType }) => {
  const { t } = useLanguage();
  const categoriesForType = getCategoriesForType(transactionType);

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field, fieldState }) => (
        <FormItem data-field="category">
          <FormLabel>{t('catSelector.category')}</FormLabel>
          <Select
            value={field.value || ''}
            onValueChange={(value) => {
              field.onChange(value);
              form.setValue('subcategory', '');
            }}
          >
            <FormControl>
              <SelectTrigger className={cn(fieldState.error && 'border-destructive')}>
                <SelectValue placeholder={t('catSelector.selectCategory')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-[300px]">
              {categoriesForType.map((category) => (
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
