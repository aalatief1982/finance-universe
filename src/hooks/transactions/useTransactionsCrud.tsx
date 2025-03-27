import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';
import { 
  getStoredTransactions, 
  storeTransactions, 
  storeTransaction, 
  removeTransaction, 
  addCategoryChange 
} from '@/utils/storage-utils';

export function useTransactionsCrud() {
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const { toast } = useToast();

  // Load transactions from storage on mount
  useEffect(() => {
    try {
      const storedTransactions = getStoredTransactions();
      setTransactionsState(storedTransactions);
    } catch (error) {
      console.error('Error loading transactions from storage:', error);
      setTransactionsState([]);
      
      toast({
        title: "Error loading transactions",
        description: "There was a problem loading your transactions. Some data may be missing.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Wrapper for state updates that also updates storage
  const setTransactions = useCallback((newTransactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    setTransactionsState(prev => {
      const nextTransactions = typeof newTransactions === 'function' 
        ? newTransactions(prev) 
        : newTransactions;
      
      // Update storage
      try {
        storeTransactions(nextTransactions);
      } catch (error) {
        console.error('Error saving transactions to storage:', error);
        
        toast({
          title: "Error saving transactions",
          description: "There was a problem saving your transactions. Please try again.",
          variant: "destructive"
        });
      }
      
      return nextTransactions;
    });
  }, [toast]);

  const handleAddTransaction = useCallback((formData: any) => {
    try {
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

      // Store directly using the enhanced storage function
      storeTransaction(newTransaction);
      
      // Update local state
      setTransactionsState(prev => [newTransaction, ...prev]);
      setIsAddingExpense(false);
      
      toast({
        title: "Transaction added",
        description: `${newTransaction.title} has been added successfully.`,
      });
      
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      toast({
        title: "Error adding transaction",
        description: "There was a problem adding your transaction. Please try again.",
        variant: "destructive"
      });
      
      return null;
    }
  }, [toast]);

  const handleEditTransaction = useCallback((formData: any) => {
    try {
      if (!currentTransaction) return null;

      const transactionType: "income" | "expense" = formData.amount >= 0 ? "income" : "expense";

      const updatedTransaction: Transaction = {
        ...currentTransaction,
        title: formData.title,
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
        type: transactionType,
        notes: formData.notes,
      };

      // Track category changes if the category was changed
      if (updatedTransaction.category !== currentTransaction.category) {
        addCategoryChange({
          transactionId: currentTransaction.id,
          oldCategoryId: currentTransaction.category,
          newCategoryId: updatedTransaction.category,
          timestamp: new Date().toISOString()
        });
      }

      // Update storage directly
      storeTransaction(updatedTransaction);
      
      // Update local state
      setTransactionsState(prev => 
        prev.map(t => t.id === currentTransaction.id ? updatedTransaction : t)
      );
      
      setIsEditingExpense(false);
      setCurrentTransaction(null);
      
      toast({
        title: "Transaction updated",
        description: `${updatedTransaction.title} has been updated successfully.`,
      });
      
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      
      toast({
        title: "Error updating transaction",
        description: "There was a problem updating your transaction. Please try again.",
        variant: "destructive"
      });
      
      return null;
    }
  }, [currentTransaction, toast]);

  const handleDeleteTransaction = useCallback((id: string) => {
    try {
      // Remove from storage directly
      removeTransaction(id);
      
      // Update local state
      setTransactionsState(prev => {
        const filteredTransactions = prev.filter(t => t.id !== id);
        return filteredTransactions;
      });
      
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      
      toast({
        title: "Error deleting transaction",
        description: "There was a problem deleting your transaction. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const openEditDialog = useCallback((transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsEditingExpense(true);
  }, []);

  // Bulk operations
  const bulkDeleteTransactions = useCallback((ids: string[]) => {
    try {
      // Get current transactions
      const currentTransactions = getStoredTransactions();
      
      // Filter out the transactions to delete
      const remainingTransactions = currentTransactions.filter(
        transaction => !ids.includes(transaction.id)
      );
      
      // Update storage
      storeTransactions(remainingTransactions);
      
      // Update local state
      setTransactionsState(remainingTransactions);
      
      toast({
        title: "Transactions deleted",
        description: `${ids.length} transactions have been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error bulk deleting transactions:', error);
      
      toast({
        title: "Error deleting transactions",
        description: "There was a problem deleting the transactions. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const bulkUpdateCategory = useCallback((ids: string[], newCategory: string) => {
    try {
      // Get current transactions
      const currentTransactions = getStoredTransactions();
      
      // Create updated transactions
      const updatedTransactions = currentTransactions.map(transaction => {
        if (ids.includes(transaction.id)) {
          // Track the category change
          if (transaction.category !== newCategory) {
            addCategoryChange({
              transactionId: transaction.id,
              oldCategoryId: transaction.category,
              newCategoryId: newCategory,
              timestamp: new Date().toISOString()
            });
          }
          
          // Return updated transaction
          return {
            ...transaction,
            category: newCategory
          };
        }
        return transaction;
      });
      
      // Update storage
      storeTransactions(updatedTransactions);
      
      // Update local state
      setTransactionsState(updatedTransactions);
      
      toast({
        title: "Categories updated",
        description: `${ids.length} transactions have been updated to category '${newCategory}'.`,
      });
    } catch (error) {
      console.error('Error bulk updating transaction categories:', error);
      
      toast({
        title: "Error updating categories",
        description: "There was a problem updating the transaction categories. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

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
    openEditDialog,
    // New bulk operations
    bulkDeleteTransactions,
    bulkUpdateCategory
  };
}
