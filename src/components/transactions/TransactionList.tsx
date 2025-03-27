import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '@/types/transaction';
import TransactionCard from '@/components/transactions/TransactionCard';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onAdd
}) => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('date_desc');

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(
    new Set(transactions.map(t => t.category))
  );

  // Apply filters
  const filteredTransactions = transactions.filter(t => {
    // Search query filter
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Category filter
    if (selectedCategory && t.category !== selectedCategory) {
      return false;
    }

    // Type filter
    if (selectedType === 'income' && t.amount <= 0) {
      return false;
    }
    if (selectedType === 'expense' && t.amount >= 0) {
      return false;
    }

    // Date range filter
    if (startDate && new Date(t.date) < startDate) {
      return false;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(t.date) > endOfDay) {
        return false;
      }
    }

    // Amount range filter
    if (minAmount !== undefined && t.amount < minAmount) {
      return false;
    }
    if (maxAmount !== undefined && t.amount > maxAmount) {
      return false;
    }

    return true;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const [field, direction] = sortBy.split('_');
    const isAsc = direction === 'asc';
    
    switch (field) {
      case 'date':
        return isAsc 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return isAsc ? a.amount - b.amount : b.amount - a.amount;
      case 'title':
        return isAsc 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  // Calculate summary
  const summary = filteredTransactions.reduce(
    (acc, t) => {
      if (t.amount > 0) {
        acc.income += t.amount;
      } else {
        acc.expenses += Math.abs(t.amount);
      }
      acc.balance += t.amount;
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
    setStartDate(null);
    setEndDate(null);
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setSortBy('date_desc');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Transactions</h2>
        <Button onClick={onAdd} size="sm">
          <Plus size={16} className="mr-1" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
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
            advancedMode={advancedMode}
            setAdvancedMode={setAdvancedMode}
            minAmount={minAmount}
            setMinAmount={setMinAmount}
            maxAmount={maxAmount}
            setMaxAmount={setMaxAmount}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.income)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.expenses)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'Transaction' : 'Transactions'}
          </h3>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No transactions found matching your filters.</p>
            {transactions.length > 0 && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {sortedTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <TransactionCard
                  transaction={transaction}
                  onEdit={() => onEdit(transaction)}
                  onDelete={() => onDelete(transaction.id)}
                  showActions={true}
                  className="cursor-pointer"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
