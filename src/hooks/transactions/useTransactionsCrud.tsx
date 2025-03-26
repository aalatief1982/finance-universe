
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';
import { INITIAL_TRANSACTIONS } from '@/lib/mock-data';

export function useTransactionsCrud() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load transactions from localStorage or use initial data
    try {
      const storedTransactions = localStorage.getItem('transactions');
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } catch (error) {
      console.error('Error loading transactions from localStorage:', error);
      setTransactions(INITIAL_TRANSACTIONS);
    }
  }, []);

  useEffect(() => {
    // Save transactions to localStorage whenever they change
    if (transactions.length > 0) {
      try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error('Error saving transactions to localStorage:', error);
      }
    }
  }, [transactions]);

  const handleAddTransaction = (formData: any) => {
    const transactionType: "income" | "expense" = formData.amount >= 0 ? "income" : "expense";
    
    const newTransaction: Transaction = {
      id: uuidv4(),
      title: formData.title,
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      type: transactionType,
      notes: formData.notes,
      source: 'manual'
    };

    setTransactions([newTransaction, ...transactions]);
    setIsAddingExpense(false);
    
    toast({
      title: "Transaction added",
      description: `${newTransaction.title} has been added successfully.`,
    });
  };

  const handleEditTransaction = (formData: any) => {
    if (!currentTransaction) return;

    const transactionType: "income" | "expense" = formData.amount >= 0 ? "income" : "expense";

    const updatedTransactions = transactions.map(t => 
      t.id === currentTransaction.id 
        ? {
            ...t,
            title: formData.title,
            amount: formData.amount,
            category: formData.category,
            date: formData.date,
            type: transactionType,
            notes: formData.notes,
          }
        : t
    );

    setTransactions(updatedTransactions);
    setIsEditingExpense(false);
    setCurrentTransaction(null);
    
    toast({
      title: "Transaction updated",
      description: `${formData.title} has been updated successfully.`,
    });
  };

  const handleDeleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    
    toast({
      title: "Transaction deleted",
      description: "The transaction has been deleted successfully.",
    });
  };

  const openEditDialog = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsEditingExpense(true);
  };

  return {
    transactions,
    setTransactions,
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
