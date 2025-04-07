
import React from 'react';
import { DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { CATEGORIES } from '@/lib/mock-data';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
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
