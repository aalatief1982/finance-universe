
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { Transaction } from '@/types/transaction';

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentTransaction: Transaction | null;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  categories: string[];
}

const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  currentTransaction,
  onSubmit,
  onCancel,
  categories
}) => {
  if (!currentTransaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
            person: currentTransaction.person || 'none',
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
