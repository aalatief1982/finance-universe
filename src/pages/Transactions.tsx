import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import TransactionHeader from '@/components/transactions/TransactionHeader';
import TransactionsByDate from '@/components/transactions/TransactionsByDate';
import EditTransactionDialog from '@/components/transactions/EditTransactionDialog';
import MobileActions from '@/components/transactions/MobileActions';
import SwipeableTransactionCard from '@/components/transactions/SwipeableTransactionCard';
import { useTransactionsState } from '@/hooks/useTransactionsState';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Search, Filter, List, Grid  } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORIES } from '@/lib/mock-data';
import { useNavigate } from 'react-router-dom';

const Transactions = () => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'swipeable'>('list');
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    transactions,
    currentTransaction,
    isAddingExpense,
    setIsAddingExpense,
    isEditingExpense,
    setIsEditingExpense,
    handleAddTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    openEditDialog,
    setCurrentTransaction,
  } = useTransactionsState();
  
  // Filter transactions based on tab and search query
  const filteredTransactions = transactions.filter(tx => {
    // Filter by type
    if (filter !== 'all') {
      const isIncome = tx.amount > 0;
      if ((filter === 'income' && !isIncome) || (filter === 'expense' && isIncome)) {
        return false;
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tx.title.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        (tx.notes && tx.notes.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  return (
    <Layout withPadding={false}>
      <div className="sticky top-[var(--header-height)] z-10 bg-background/80 backdrop-blur-xl border-b">
        <div className="px-[var(--page-padding-x)] py-[var(--page-padding-y)]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <div className="flex items-center space-x-2">
              {isMobile && (
                <div className="border rounded-md p-1">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'swipeable' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('swipeable')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button size="sm" onClick={() => navigate('/edit-transaction')}>
                Add Transaction
              </Button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={filter} onValueChange={value => setFilter(value as 'all' | 'income' | 'expense')}>
              <TabsList className="h-10">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="min-w-[90px] flex gap-2" size="sm">
              <Filter size={16} />
              Filter
            </Button>
          </div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="px-[var(--page-padding-x)] py-[var(--page-padding-y)] mt-2"
      >
        {filteredTransactions.length > 0 ? (
          isMobile && viewMode === 'swipeable' ? (
            <div className="space-y-[var(--card-spacing)]">
              {filteredTransactions.map((transaction, index) => (
				  <SwipeableTransactionCard 
					key={transaction.id || `txn-${index}`} // ensure uniqueness
					transaction={transaction}
				  />
				))}
            </div>
          ) : (
            <TransactionsByDate transactions={filteredTransactions} />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-[var(--section-spacing)] text-center">
            <p className="text-muted-foreground mb-4">No transactions found</p>
            <Button onClick={() => navigate('/edit-transaction')}>
              Add Transaction
            </Button>
          </div>
        )}
      </motion.div>
      
      <EditTransactionDialog
        isOpen={isEditingExpense}
        onOpenChange={setIsEditingExpense}
        currentTransaction={currentTransaction}
        onSubmit={handleEditTransaction}
        onCancel={() => {
          setIsEditingExpense(false);
          setCurrentTransaction(null);
        }}
        categories={CATEGORIES}
      />
      
      <MobileActions
        onAddTransaction={() => navigate('/edit-transaction')}
        onToggleFilters={() => {}}
        filtersVisible={false}
      />
    </Layout>
  );
};

export default Transactions;
