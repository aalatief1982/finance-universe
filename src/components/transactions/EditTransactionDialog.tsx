
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { Transaction } from '@/types/transaction';
import { TransactionFormValues } from '@/components/forms/transaction-form-schema';
import { useLanguage } from '@/i18n/LanguageContext';

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
  const { t } = useLanguage();
  
  if (!currentTransaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Reduce top padding for better alignment */}
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto pt-2">
        {origin === 'ml' && (
          <p className="text-yellow-600 text-xs mb-2">
            {t('edit.aiGeneratedFields')}
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
