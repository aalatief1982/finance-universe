
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues, PEOPLE } from './transaction-form-schema';

interface PersonSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
}

const PersonSelector: React.FC<PersonSelectorProps> = ({
  form
}) => {
  return (
    <FormField
      control={form.control}
      name="person"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Main Person</FormLabel>
          <Select
            value={field.value || "none"}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select person (optional)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {PEOPLE.map(person => (
                <SelectItem key={person} value={person}>
                  {person}
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

export default PersonSelector;
