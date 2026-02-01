/**
 * @file ExpenseForm.tsx
 * @description UI component for ExpenseForm.
 *
 * @module components/ExpenseForm
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
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import TitleField from './forms/TitleField';
import AmountField from './forms/AmountField';
import DateField from './forms/DateField';
import DescriptionField from './forms/DescriptionField';
import NotesField from './forms/NotesField';
import FormActions from './forms/FormActions';

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
      const currentSubcategory = form.getValues().subcategory;
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
      <Card className="border border-border shadow-sm max-h-[80vh] overflow-y-auto">
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
              <TitleField form={form} />
              
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <AmountField form={form} />
                
                {/* Currency */}
                <CurrencySelector form={form} />
              </div>
              
              {/* Accounts Section */}
              <div className="grid grid-cols-1 gap-4">
                {/* From Account */}
                {(transactionType === 'expense' || transactionType === 'transfer') && (
                  <AccountSelector form={form} isFromAccount={true} />
                )}
                
                {/* To Account - Shown for Income and Transfer */}
                {(transactionType === 'income' || transactionType === 'transfer') && (
                  <AccountSelector form={form} isFromAccount={false} />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <CategorySelector form={form} transactionType={transactionType} />
                
                {/* Show either Subcategory or Date depending on whether subcategories are available */}
                {selectedCategory && availableSubcategories.length > 0 ? (
                  <SubcategorySelector form={form} availableSubcategories={availableSubcategories} />
                ) : (
                  <DateField form={form} />
                )}
              </div>
              
              {/* Date - Show in another row if subcategory is shown */}
              {selectedCategory && availableSubcategories.length > 0 && (
                <DateField form={form} />
              )}
              
              {/* Person */}
              <PersonSelector form={form} />
              
              {/* Description */}
              <DescriptionField form={form} />
              
              {/* Notes */}
              <NotesField form={form} />
              
              {/* Form Actions */}
              <FormActions onCancel={onCancel} isUpdate={!!defaultValues.title} />
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseForm;
