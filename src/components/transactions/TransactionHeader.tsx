
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';

interface TransactionHeaderProps {
  isAddingExpense: boolean;
  setIsAddingExpense: (isAdding: boolean) => void;
  onAddTransaction: (formData: any) => void;
  categories: string[];
}

const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  isAddingExpense,
  setIsAddingExpense,
  onAddTransaction,
  categories
}) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
      <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
        <Button className="gap-1" onClick={() => setIsAddingExpense(true)}>
          <Plus size={18} />
          Add Transaction
        </Button>
        <DialogContent className="sm:max-w-md">
          <ExpenseForm 
            onSubmit={onAddTransaction} 
            categories={categories}
            onCancel={() => setIsAddingExpense(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHeader;
