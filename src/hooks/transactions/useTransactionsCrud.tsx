import { useState, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';

export function useTransactionsCrud() {
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const { toast } = useToast();

  const openEditDialog = useCallback((transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsEditingExpense(true);
  }, []);

  const handleAddTransaction = (formData: any) => {
    // Extract only the properties that belong to Transaction type
    const {
      title,
      amount,
      category,
      date,
      notes,
      fromAccount,
      toAccount,
      person,
      currency
    } = formData;
    
    const transactionType: "income" | "expense" = amount >= 0 ? "income" : "expense";
    
    const newTransaction: Omit<Transaction, 'id'> = {
      title,
      amount,
      category,
      date,
      type: transactionType,
      notes,
      fromAccount,
      toAccount,
      person,
      currency,
      source: 'manual'
    };
    
    setIsAddingExpense(false);
    return newTransaction;
  };

  const handleEditTransaction = (formData: any) => {
    if (!currentTransaction) return null;

    // Extract only valid Transaction properties
    const {
      title,
      amount,
      category,
      date,
      notes,
      fromAccount,
      toAccount,
      person,
      currency
    } = formData;
    
    const transactionType: "income" | "expense" = amount >= 0 ? "income" : "expense";
    
    const updatedTransaction: Transaction = {
      ...currentTransaction,
      title,
      amount,
      category,
      date,
      type: transactionType,
      notes,
      fromAccount,
      toAccount,
      person,
      currency
    };
    
    setIsEditingExpense(false);
    setCurrentTransaction(null);
    return updatedTransaction;
  };

  const handleDeleteTransaction = useCallback((id: string) => {
    toast({
      title: 'Transaction Deleted',
      description: 'Your transaction has been deleted successfully.',
    });
    return id;
  }, [toast]);

  return {
    currentTransaction,
    setCurrentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    handleAddTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    openEditDialog
  };
}
