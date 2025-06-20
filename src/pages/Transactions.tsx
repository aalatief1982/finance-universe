
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import TransactionsByDate from '@/components/transactions/TransactionsByDate';
import EditTransactionDialog from '@/components/transactions/EditTransactionDialog';
import MobileActions from '@/components/transactions/MobileActions';
import SwipeableTransactionCard from '@/components/transactions/SwipeableTransactionCard';
import { useTransactionsState } from '@/hooks/useTransactionsState';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Search, Filter, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORIES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
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
    <Layout withPadding={false} showBack fullWidth>
      <PageHeader
        title={null}
        className="pt-2"
        actions={
          <>
            {isMobile && (
              <div className="border rounded-md p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 rounded-md bg-transparent text-muted-foreground',
                    viewMode === 'list' && 'bg-primary text-white'
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 rounded-md bg-transparent text-muted-foreground',
                    viewMode === 'swipeable' && 'bg-primary text-white'
                  )}
                  onClick={() => setViewMode('swipeable')}
                >
                  <Grid className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </>
        }
      />

      <div className="px-1">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 items-center pt-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
                placeholder="Search transactions..."
                className="pl-10 h-8 text-sm rounded-md w-full px-3 py-1.5"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={filter} onValueChange={value => setFilter(value as 'all' | 'income' | 'expense')}>
              <TabsList className="h-8 bg-gray-100 rounded-md p-0.5">
                <TabsTrigger
                  value="all"
                  className="text-xs px-2.5 bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:rounded-md"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="text-xs px-2.5 bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:rounded-md"
                >
                  Income
                </TabsTrigger>
                <TabsTrigger
                  value="expense"
                  className="text-xs px-2.5 bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:rounded-md"
                >
                  Expense
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="min-w-[80px] flex gap-1.5 h-8"  size="sm">
              <Filter size={14} />
              Filter
            </Button>
          </div>
        </div>

        <div className="pt-2 pb-24 mt-1">
          {filteredTransactions.length > 0 ? (
            isMobile && viewMode === 'swipeable' ? (
              <div className="space-y-[var(--card-gap)]">
                {filteredTransactions.map((transaction, index) => (
                  <SwipeableTransactionCard
                    key={transaction.id || `txn-${index}`}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <TransactionsByDate transactions={filteredTransactions} />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-[var(--section-gap)] text-center">
            <p className="text-muted-foreground mb-3">No transactions found</p>
            <Button onClick={() => navigate('/edit-transaction')}>
              Add Transaction
            </Button>
          </div>
        )}
        </div>
      </div>
      
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
