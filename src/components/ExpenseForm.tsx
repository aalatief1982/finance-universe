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
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type FieldErrors, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { TransactionType } from '@/types/transaction';
import {
  transactionFormSchema,
  TransactionFormValues,
  DEFAULT_FORM_VALUES,
  validateTransactionForm,
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
import FxEstimateDisplay from './forms/FxEstimateDisplay';
import { FxRateInput } from '@/components/fx';

interface ExpenseFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  categories: string[];
  defaultValues?: Partial<TransactionFormValues>;
  onCancel?: () => void;
}

const REQUIRED_FIELD_ORDER: FieldPath<TransactionFormValues>[] = [
  'amount',
  'fromAccount',
  'toAccount',
  'category',
  'subcategory',
  'currency',
  'date',
  'title',
];

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

  const formElementRef = useRef<HTMLFormElement>(null);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [manualRateDialogOpen, setManualRateDialogOpen] = useState(false);
  const [manualFxRate, setManualFxRate] = useState<number | undefined>(undefined);

  // Watch fields for FX estimate
  const transactionType = form.watch('type') as TransactionType;
  const selectedCategory = form.watch('category');
  const watchedAmount = form.watch('amount');
  const watchedCurrency = form.watch('currency');
  const watchedDate = form.watch('date');

  // keep prop as part of public API for compatibility
  void categories;

  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subcategories = getSubcategoriesForCategory(selectedCategory as string);
      setAvailableSubcategories(subcategories);

      // If current subcategory is not available, clear it
      const currentSubcategory = form.getValues().subcategory;
      if (currentSubcategory && !subcategories.includes(currentSubcategory)) {
        form.setValue('subcategory', '');
      }
    } else {
      setAvailableSubcategories([]);
      const currentSubcategory = form.getValues().subcategory;
      if (currentSubcategory !== '') {
        form.setValue('subcategory', '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const scrollToInvalidField = (fieldName: FieldPath<TransactionFormValues>) => {
    const root = formElementRef.current;
    if (!root) return;

    const target =
      root.querySelector<HTMLElement>(`[name="${fieldName}"]`) ||
      root.querySelector<HTMLElement>(`[data-field="${fieldName}"] button`) ||
      root.querySelector<HTMLElement>(`[data-field="${fieldName}"] input`) ||
      root.querySelector<HTMLElement>(`[data-field="${fieldName}"]`);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in target) {
        target.focus({ preventScroll: true });
      }
    }
  };

  const applyValidationErrors = (errors: FieldErrors<TransactionFormValues>) => {
    const values = form.getValues();
    const validationErrors = validateTransactionForm(values, values.type);

    Object.entries(validationErrors).forEach(([name, message]) => {
      if (!message) return;
      form.setError(name as FieldPath<TransactionFormValues>, { type: 'manual', message });

      const fieldName = name as FieldPath<TransactionFormValues>;
      form.setValue(fieldName, form.getValues(fieldName), { shouldTouch: true, shouldValidate: false });
    });

    if (Object.keys(errors).length > 0 || Object.keys(validationErrors).length > 0) {
      const invalidFieldOrder = REQUIRED_FIELD_ORDER.filter(
        (field) => errors[field] || validationErrors[field]
      );

      const firstInvalidField = invalidFieldOrder[0];
      if (firstInvalidField) {
        scrollToInvalidField(firstInvalidField);
      }

      return false;
    }

    return true;
  };

  const handleSubmit = (values: TransactionFormValues) => {
    if (!applyValidationErrors({})) {
      return;
    }

    // Pass manual rate if set
    const submissionValues = manualFxRate ? { ...values, _manualFxRate: manualFxRate } : values;
    onSubmit(submissionValues as TransactionFormValues);
    form.reset();
    setManualFxRate(undefined);
  };

  const handleManualRateConfirm = (rate: number) => {
    setManualFxRate(rate);
    setManualRateDialogOpen(false);
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
            {defaultValues.title ? 'Edit Transaction' : 'Add New Transaction'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form ref={formElementRef} onSubmit={form.handleSubmit(handleSubmit, applyValidationErrors)} className="space-y-4">
              {/* Transaction Type */}
              <TransactionTypeSelector form={form} />

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <AmountField form={form} />

                {/* Currency */}
                <CurrencySelector form={form} />
              </div>

              {/* FX Estimate Display */}
              <FxEstimateDisplay
                amount={typeof watchedAmount === 'number' ? watchedAmount : undefined}
                currency={typeof watchedCurrency === 'string' ? watchedCurrency : undefined}
                date={typeof watchedDate === 'string' ? watchedDate : undefined}
                onRequestManualRate={() => setManualRateDialogOpen(true)}
              />

              {/* Manual Rate Dialog */}
              <FxRateInput
                isOpen={manualRateDialogOpen}
                onOpenChange={setManualRateDialogOpen}
                amount={typeof watchedAmount === 'number' ? watchedAmount : 0}
                fromCurrency={typeof watchedCurrency === 'string' ? watchedCurrency : 'USD'}
                toCurrency={form.getValues().currency || 'SAR'}
                onConfirm={handleManualRateConfirm}
                initialRate={manualFxRate}
              />

              {/* Accounts Section */}
              <div className="grid grid-cols-1 gap-4">
                <AccountSelector form={form} isFromAccount={true} isRequired={true} />

                {transactionType === 'transfer' && (
                  <AccountSelector form={form} isFromAccount={false} isRequired={true} />
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
              {selectedCategory && availableSubcategories.length > 0 && <DateField form={form} />}

              {/* Title */}
              <TitleField form={form} />

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
