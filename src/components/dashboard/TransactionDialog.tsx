/**
 * @file TransactionDialog.tsx
 * @description UI component for TransactionDialog.
 *
 * @module components/dashboard/TransactionDialog
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
import { DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { CATEGORIES } from '@/lib/mock-data';
import { TransactionFormValues } from '@/components/forms/transaction-form-schema';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: TransactionFormValues) => void;
}

const TransactionDialog = ({ isOpen, onClose, onSubmit }: TransactionDialogProps) => {
  if (!isOpen) return null;
  
  return (
    <DialogContent className="sm:max-w-md">
      <ExpenseForm 
        onSubmit={onSubmit} 
        categories={CATEGORIES}
        onCancel={onClose}
      />
    </DialogContent>
  );
};

export default TransactionDialog;
