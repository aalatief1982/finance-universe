
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Plus, MessageSquare } from 'lucide-react';
import { DialogTrigger } from '@/components/ui/dialog';
import ExpenseCard from '@/components/ExpenseCard';
import { Transaction } from '@/types/transaction';
import { formatDate } from '@/lib/formatters';

interface RecentTransactionsProps {
  filter: 'all' | 'income' | 'expense';
  setFilter: (filter: 'all' | 'income' | 'expense') => void;
  transactions: Transaction[];
  setIsAddingExpense: (value: boolean) => void;
}

const RecentTransactions = ({ 
  filter, 
  setFilter, 
  transactions,
  setIsAddingExpense
}: RecentTransactionsProps) => {
  // Sort transactions by date (most recent first) and apply filter
  const filteredTransactions = transactions
    .filter(tx => {
      if (filter === 'all') return true;
      return filter === 'income' ? tx.amount > 0 : tx.amount < 0;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Show only the 5 most recent

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <div className="flex items-center gap-2">
          <TabsList className="h-8 bg-muted/50">
            <TabsTrigger 
              value="all" 
              className="text-xs px-3 h-7"
              onClick={() => setFilter('all')}
              data-state={filter === 'all' ? 'active' : 'inactive'}
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="income" 
              className="text-xs px-3 h-7"
              onClick={() => setFilter('income')}
              data-state={filter === 'income' ? 'active' : 'inactive'}
            >
              Income
            </TabsTrigger>
            <TabsTrigger 
              value="expense" 
              className="text-xs px-3 h-7"
              onClick={() => setFilter('expense')}
              data-state={filter === 'expense' ? 'active' : 'inactive'}
            >
              Expenses
            </TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <ExpenseCard
              key={transaction.id}
              id={transaction.id}
              title={transaction.title}
              amount={transaction.amount}
              category={transaction.category}
              date={formatDate(transaction.date)}
            />
          ))
        ) : (
          <div className="text-center py-8 border rounded-lg flex flex-col items-center">
            <p className="text-muted-foreground mb-3">No transactions found</p>
            <div className="flex space-x-2">
              <Button size="sm" asChild>
                <Link to="/process-sms">
                  <MessageSquare className="mr-1" size={16} />
                  Import from SMS
                </Link>
              </Button>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setIsAddingExpense(true)}>
                  <Plus className="mr-1" size={16} />
                  Add Manually
                </Button>
              </DialogTrigger>
            </div>
          </div>
        )}
        {filteredTransactions.length > 0 && (
          <Button variant="outline" size="sm" className="w-full mt-4" asChild>
            <Link to="/transactions">
              View All Transactions
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
