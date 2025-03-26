
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Layout from '@/components/Layout';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExpenseForm from '@/components/ExpenseForm';
import { CATEGORIES, INITIAL_TRANSACTIONS } from '@/lib/mock-data';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';

// Import refactored components
import TransactionHeader from '@/components/transactions/TransactionHeader';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import ViewToggle from '@/components/transactions/ViewToggle';
import TransactionGrid from '@/components/transactions/TransactionGrid';
import TransactionTable from '@/components/TransactionTable';
import EmptyTransactionState from '@/components/transactions/EmptyTransactionState';
import PaginationInfo from '@/components/transactions/PaginationInfo';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load transactions from localStorage or use initial data
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
    }
  }, []);

  useEffect(() => {
    // Save transactions to localStorage whenever they change
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    // Filter and sort transactions based on all criteria
    let filtered = [...transactions];

    // Text search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Type filter
    if (selectedType) {
      const isExpense = selectedType === 'expense';
      filtered = filtered.filter(t => isExpense ? t.amount < 0 : t.amount > 0);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    
    if (endDate) {
      // Add one day to include the end date fully
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      filtered = filtered.filter(t => new Date(t.date) < endDatePlusOne);
    }

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch(sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [transactions, searchQuery, selectedCategory, selectedType, startDate, endDate, sortField, sortDirection]);

  // Calculate pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedTransactions(filteredTransactions.slice(startIndex, endIndex));
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new field
    }
  };

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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
    setStartDate(null);
    setEndDate(null);
  };

  // Get unique categories from transactions
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Check if any filters are active
  const hasActiveFilters = Boolean(searchQuery || selectedCategory || selectedType || startDate || endDate);

  return (
    <>
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <TransactionHeader 
            isAddingExpense={isAddingExpense}
            setIsAddingExpense={setIsAddingExpense}
            onAddTransaction={handleAddTransaction}
            categories={CATEGORIES}
          />
          
          <div className="flex items-center justify-between">
            <TransactionFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              clearFilters={clearFilters}
              uniqueCategories={uniqueCategories}
              filtersVisible={filtersVisible}
              setFiltersVisible={setFiltersVisible}
            />
            
            <ViewToggle 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
            />
          </div>
          
          {paginatedTransactions.length > 0 ? (
            viewMode === 'grid' ? (
              <TransactionGrid
                transactions={paginatedTransactions}
                onEditTransaction={openEditDialog}
                onDeleteTransaction={handleDeleteTransaction}
              />
            ) : (
              <TransactionTable
                transactions={paginatedTransactions}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onRowClick={openEditDialog}
              />
            )
          ) : (
            <EmptyTransactionState
              hasTransactions={transactions.length > 0}
              hasFilters={hasActiveFilters}
              onAddTransaction={() => setIsAddingExpense(true)}
              onClearFilters={clearFilters}
            />
          )}
          
          {filteredTransactions.length > itemsPerPage && (
            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTransactions.length}
              onPageChange={setCurrentPage}
            />
          )}
        </motion.div>
      </Layout>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditingExpense} onOpenChange={setIsEditingExpense}>
        <DialogContent className="sm:max-w-md">
          {currentTransaction && (
            <ExpenseForm 
              onSubmit={handleEditTransaction} 
              categories={CATEGORIES}
              defaultValues={{
                title: currentTransaction.title,
                amount: Math.abs(currentTransaction.amount),
                category: currentTransaction.category,
                date: currentTransaction.date,
                type: currentTransaction.amount >= 0 ? 'income' : 'expense',
                notes: currentTransaction.notes || '',
              }}
              onCancel={() => {
                setIsEditingExpense(false);
                setCurrentTransaction(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Transactions;
