
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { transactionService } from '@/services/TransactionService';
import { TransactionType } from '@/types/transaction';
import { 
  transactionFormSchema, 
  TransactionFormValues, 
  DEFAULT_FORM_VALUES 
} from './forms/transaction-form-schema';
import { getSubcategoriesForCategory } from '@/lib/categories-data';

// Import form component pieces
import CategorySelector from './forms/CategorySelector';
import SubcategorySelector from './forms/SubcategorySelector';
import TransactionTypeSelector from './forms/TransactionTypeSelector';
import AccountSelector from './forms/AccountSelector';
import PersonSelector from './forms/PersonSelector';
import CurrencySelector from './forms/CurrencySelector';

interface ExpenseFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  categories: string[];
  defaultValues?: Partial<TransactionFormValues>;
  onCancel?: () => void;
}

const ExpenseForm = ({
  onSubmit,
  categories,
  defaultValues = DEFAULT_FORM_VALUES,
  onCancel,
}: ExpenseFormProps) => {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });
  
  const [selectedCategoryName, setSelectedCategoryName] = useState(defaultValues.category || '');
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  
  // Watch the transaction type to conditionally render fields
  const transactionType = form.watch("type") as TransactionType;
  const selectedCategory = form.watch("category");
  
  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subcategories = getSubcategoriesForCategory(selectedCategory);
      setAvailableSubcategories(subcategories);
      
      // If current subcategory is not available, reset it to "none"
      const currentSubcategory = form.getValues("subcategory");
      if (currentSubcategory && currentSubcategory !== "none" && !subcategories.includes(currentSubcategory)) {
        form.setValue("subcategory", "none");
      }
    } else {
      setAvailableSubcategories([]);
      form.setValue("subcategory", "none");
    }
  }, [selectedCategory, form]);

  const handleSubmit = (values: TransactionFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-center">
            {defaultValues.title ? "Edit Transaction" : "Add New Transaction"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Transaction Type */}
              <TransactionTypeSelector form={form} />
              
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
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
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Currency */}
                <CurrencySelector form={form} />
              </div>
              
              {/* Accounts Section */}
              <div className="grid grid-cols-1 gap-4">
                {/* From Account */}
                <AccountSelector form={form} isFromAccount={true} />
                
                {/* To Account - Only shown for Transfer */}
                {transactionType === 'transfer' && (
                  <AccountSelector form={form} isFromAccount={false} />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <CategorySelector 
                  form={form} 
                  transactionType={transactionType}
                  selectedCategoryName={selectedCategoryName}
                  setSelectedCategoryName={setSelectedCategoryName}
                />
                
                {/* Subcategory */}
                {selectedCategory && availableSubcategories.length > 0 ? (
                  <SubcategorySelector 
                    form={form} 
                    availableSubcategories={availableSubcategories} 
                  />
                ) : (
                  /* Date - Show in the grid if subcategory is not shown */
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {/* Date - Show in another row if subcategory is shown */}
              {selectedCategory && availableSubcategories.length > 0 && (
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Person */}
              <PersonSelector form={form} />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a detailed description..." 
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit">
                  {defaultValues.title ? "Update" : "Add"} Transaction
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseForm;
