
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ExpenseCard from '@/components/ExpenseCard';
import CategoryPill from '@/components/CategoryPill';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExpenseForm from '@/components/ExpenseForm';
import { CATEGORIES, INITIAL_TRANSACTIONS, Transaction } from '@/lib/mock-data';
import { formatDate } from '@/lib/formatters';
import { Plus, Search, Filter, Trash2, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
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
    // Filter transactions based on search, category, and type
    let filtered = [...transactions];

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedType) {
      const isExpense = selectedType === 'expense';
      filtered = filtered.filter(t => isExpense ? t.amount < 0 : t.amount > 0);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, selectedCategory, selectedType]);

  const handleAddTransaction = (formData: any) => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      title: formData.title,
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      type: formData.amount >= 0 ? 'income' : 'expense',
      notes: formData.notes,
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

    const updatedTransactions = transactions.map(t => 
      t.id === currentTransaction.id 
        ? {
            ...t,
            title: formData.title,
            amount: formData.amount,
            category: formData.category,
            date: formData.date,
            type: formData.amount >= 0 ? 'income' : 'expense',
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
  };

  // Get unique categories from transactions
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  return (
    <>
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
              <Button className="gap-1" onClick={() => setIsAddingExpense(true)}>
                <Plus size={18} />
                Add Transaction
              </Button>
              <DialogContent className="sm:max-w-md">
                <ExpenseForm 
                  onSubmit={handleAddTransaction} 
                  categories={CATEGORIES}
                  onCancel={() => setIsAddingExpense(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchQuery || selectedCategory || selectedType) && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                  <Filter className="text-muted-foreground" size={18} />
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <ExpenseCard
                        id={transaction.id}
                        title={transaction.title}
                        amount={transaction.amount}
                        category={transaction.category}
                        date={formatDate(transaction.date)}
                        onClick={() => openEditDialog(transaction)}
                      />
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive">
                          <Trash2 size={18} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete transaction</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this transaction? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calendar className="text-muted-foreground" size={24} />
                </div>
                <h3 className="text-lg font-medium">No transactions found</h3>
                <p className="text-muted-foreground mt-1">
                  {transactions.length === 0 
                    ? "You haven't added any transactions yet." 
                    : "No transactions match your current filters."}
                </p>
                {transactions.length === 0 && (
                  <Button className="mt-4" onClick={() => setIsAddingExpense(true)}>
                    Add your first transaction
                  </Button>
                )}
                {transactions.length > 0 && (searchQuery || selectedCategory || selectedType) && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </motion.div>
            )}
          </div>
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
