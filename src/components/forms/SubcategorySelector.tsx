
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';

interface SubcategorySelectorProps {
  form: UseFormReturn<TransactionFormValues>;
  availableSubcategories: string[];
}

const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({
  form,
  availableSubcategories
}) => {
  if (!availableSubcategories.length) return null;

  return (
    <FormField
      control={form.control}
      name="subcategory"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Subcategory</FormLabel>
          <Select
            value={field.value || "none"}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {availableSubcategories.map(subcategory => (
                <SelectItem key={subcategory} value={subcategory}>
                  {subcategory}
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

export default SubcategorySelector;
