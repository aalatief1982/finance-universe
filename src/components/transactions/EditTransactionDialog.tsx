
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { Transaction } from '@/types/transaction';
import { TransactionFormValues } from '@/components/forms/transaction-form-schema';

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentTransaction: Transaction | null;
  onSubmit: (formData: TransactionFormValues) => void;
  onCancel: () => void;
  categories: string[];
  origin?: 'template' | 'structure' | 'ml' | 'fallback';
}

const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  currentTransaction,
  onSubmit,
  onCancel,
  categories,
  origin
}) => {
  if (!currentTransaction) return null;

  // Convert person value to a valid option for the form
  const personValue = currentTransaction.person || 'none';
  // Make sure personValue is a valid option
  const safePersonValue = ['none'].includes(personValue as string) 
    ? personValue 
    : 'none';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Reduce top padding for better alignment */}
      <DialogContent className="sm:max-w-md pt-2">
        {origin === 'ml' && (
          <p className="text-yellow-600 text-xs mb-2">
            AI-generated fields – please verify.
          </p>
        )}
        <ExpenseForm
          onSubmit={onSubmit}
          categories={categories}
          defaultValues={{
            title: currentTransaction.title,
            amount: Math.abs(currentTransaction.amount),
            category: currentTransaction.category,
            subcategory: currentTransaction.subcategory || "none",
            date: currentTransaction.date,
            type: currentTransaction.type || (currentTransaction.amount >= 0 ? 'income' : 'expense'),
            notes: currentTransaction.notes || '',
            description: currentTransaction.description || '',
            person: safePersonValue as 'none',
            fromAccount: currentTransaction.fromAccount || '',
            toAccount: currentTransaction.toAccount || '',
            currency: currentTransaction.currency || 'SAR',
          }}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;
