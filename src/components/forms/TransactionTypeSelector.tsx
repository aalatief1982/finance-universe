
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (vendor) {
      const m = getKeywordMatches(vendor)
      setMatches(m)
      if (m.length === 1) {
        form.setValue('type', m[0].type)
      }
    } else {
      setMatches([])
    }
  }, [vendor, form])
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
