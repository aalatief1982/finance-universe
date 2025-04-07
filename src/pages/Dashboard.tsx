
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, List, BarChart2, Settings } from 'lucide-react';
import Layout from '@/components/Layout';
import TransactionList from '@/components/transactions/TransactionList';
import ExpenseChart, { ExpenseByCategory, ExpenseByDate } from '@/components/ExpenseChart';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { INITIAL_TRANSACTIONS, generateChartData } from '@/lib/mock-data';
import { Transaction } from '@/types/transaction';
import TransactionDialog from '@/components/dashboard/TransactionDialog';
import EditTransactionDialog from '@/components/transactions/EditTransactionDialog';
import { getCategoriesByType } from '@/lib/categories-data';
import MobileSmsButton from '@/components/dashboard/MobileSmsButton';

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [expensesByDate, setExpensesByDate] = useState<ExpenseByDate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Get all category names
  const incomeCategories = getCategoriesByType('income').map(c => c.name);
  const expenseCategories = getCategoriesByType('expense').map(c => c.name);
  const allCategories = [...incomeCategories, ...expenseCategories];
  
  useEffect(() => {
    // Load user data from context
    if (user) {
      // Format the user object to handle Date objects
      const formattedUser = {
        ...user,
        createdAt: user.createdAt instanceof Date 
          ? user.createdAt.toISOString() 
          : typeof user.createdAt === 'string' 
            ? user.createdAt 
            : undefined
      };
      setUserData(formattedUser);
    }
  }, [user]);
  
  useEffect(() => {
    // Update chart data when transactions change
    const chartData = generateChartData(transactions);
    
    // Map the chart data to the expected format for ExpenseChart
    const categoryData = chartData.categoryData.map(item => ({
      name: item.name,
      value: item.value
    }));
    
    const timelineData = chartData.timelineData.map(item => ({
      name: item.name,
      value: item.value
    }));
    
    setExpensesByCategory(categoryData);
    setExpensesByDate(timelineData);
  }, [transactions]);
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  const handleOpenEditDialog = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setCurrentTransaction(null);
  };
  
  const handleAddTransaction = (formData: Transaction) => {
    const newTransaction = {
      ...formData,
      id: String(transactions.length + 1),
      amount: formData.type === 'income' ? formData.amount : -formData.amount
    };
    setTransactions([...transactions, newTransaction]);
    handleCloseDialog();
  };
  
  const handleUpdateTransaction = (formData: Transaction) => {
    if (!currentTransaction) return;
    
    const updatedTransaction = {
      ...formData,
      id: currentTransaction.id,
      amount: formData.type === 'income' ? formData.amount : -formData.amount
    };
    
    const updatedTransactions = transactions.map(tx => 
      tx.id === currentTransaction.id ? updatedTransaction : tx
    );
    
    setTransactions(updatedTransactions);
    handleCloseEditDialog();
  };
  
  const handleDeleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(tx => tx.id !== id);
    setTransactions(updatedTransactions);
  };
  
  const handleViewModeChange = (mode: 'list' | 'stats') => {
    setViewMode(mode);
  };
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container max-w-4xl mx-auto py-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleViewModeChange('list')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleViewModeChange('stats')}>
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
        
        {userData && userData.smsPermissionGranted && (
          <MobileSmsButton />
        )}
        
        {viewMode === 'stats' ? (
          <ExpenseChart 
            expensesByCategory={expensesByCategory} 
            expensesByDate={expensesByDate} 
          />
        ) : (
          <TransactionList 
            transactions={transactions} 
            onEdit={handleOpenEditDialog}
            onDelete={handleDeleteTransaction}
            onAdd={handleOpenDialog}
          />
        )}
        
        <TransactionDialog 
          isOpen={isDialogOpen} 
          onClose={handleCloseDialog} 
          onSubmit={handleAddTransaction} 
        />
        
        <EditTransactionDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentTransaction={currentTransaction}
          onSubmit={handleUpdateTransaction}
          onCancel={handleCloseEditDialog}
          categories={allCategories}
        />
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
