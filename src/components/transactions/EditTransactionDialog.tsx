
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { Transaction } from '@/types/transaction';
import { PEOPLE } from '@/lib/categories-data';

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

  // Ensure person is one of the allowed values from PEOPLE
  const personValue = PEOPLE.includes(currentTransaction.person || 'none') 
    ? currentTransaction.person 
    : 'none';

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
            date: currentTransaction.date,
            type: currentTransaction.type || (currentTransaction.amount >= 0 ? 'income' : 'expense'),
            notes: currentTransaction.notes || '',
            description: currentTransaction.description || '',
            person: personValue,
            fromAccount: currentTransaction.fromAccount || '',
            toAccount: currentTransaction.toAccount || '',
            currency: currentTransaction.currency || 'USD',
          }}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;
