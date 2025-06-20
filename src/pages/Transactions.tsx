
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import TransactionsByDate from '@/components/transactions/TransactionsByDate';
import EditTransactionDialog from '@/components/transactions/EditTransactionDialog';
import MobileActions from '@/components/transactions/MobileActions';
import { useTransactionsState } from '@/hooks/useTransactionsState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORIES } from '@/lib/mock-data';
import { useNavigate } from 'react-router-dom';

const Transactions = () => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
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
      return JSON.stringify(tx).toLowerCase().includes(query);
    }
    
    return true;
  });
  
  return (
    <Layout withPadding={false} showBack fullWidth>
      <PageHeader title={null} className="pt-2" />

      <div className="sticky top-[var(--header-height)] z-10 bg-background px-[var(--page-padding-x)] pt-2 pb-2">
        <Input
          placeholder="Search transactions..."
          className="h-8 text-sm rounded-md w-full px-3 py-1.5"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="px-[var(--page-padding-x)]">
        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
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
            <Button variant="outline" className="min-w-[80px] h-8" size="sm">
              Filter
            </Button>
          </div>
          </div>

          <div className="pt-2 pb-24 mt-1">
          {filteredTransactions.length > 0 ? (
            <TransactionsByDate transactions={filteredTransactions} />
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
