
import React from 'react';
import { DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { getCategoriesByType } from '@/lib/categories-data';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

const TransactionDialog = ({ isOpen, onClose, onSubmit }: TransactionDialogProps) => {
  if (!isOpen) return null;
  
  // Get all category names
  const incomeCategories = getCategoriesByType('income').map(c => c.name);
  const expenseCategories = getCategoriesByType('expense').map(c => c.name);
  const allCategories = [...incomeCategories, ...expenseCategories];
  
  return (
    <DialogContent className="sm:max-w-md">
      <ExpenseForm 
        onSubmit={onSubmit} 
        categories={allCategories}
        onCancel={onClose}
      />
    </DialogContent>
  );
};

export default TransactionDialog;
