/**
 * @file RecentTransactions.tsx
 * @description UI component for RecentTransactions.
 *
 * @module components/dashboard/RecentTransactions
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Plus, MessageSquare, ArrowRight } from 'lucide-react';
import TransactionCard from '@/components/transactions/TransactionCard';
import { Transaction } from '@/types/transaction';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setFilter(value as 'all' | 'income' | 'expense');
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <div className="flex items-center gap-2">
            <Tabs value={filter} onValueChange={handleTabChange}>
              <TabsList className="h-7 bg-muted/50">
                <TabsTrigger 
                  value="all" 
                  className="text-xs px-2.5 h-6"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="income" 
                  className="text-xs px-2.5 h-6"
                >
                  Income
                </TabsTrigger>
                <TabsTrigger 
                  value="expense" 
                  className="text-xs px-2.5 h-6"
                >
                  Expenses
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Refresh transactions">
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
        
        <motion.div 
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, idx) => (
              <motion.div key={transaction.id || idx} variants={itemVariants}>
                <TransactionCard
                  transaction={transaction}
                  showActions={false}
                />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 border rounded-lg flex flex-col items-center">
              <p className="text-muted-foreground mb-2 text-sm">No transactions found</p>
              <div className="flex space-x-2">
                <Button size="sm" asChild>
                  <Link to="/process-sms">
                    <MessageSquare className="mr-1" size={14} />
                    Import SMS
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsAddingExpense(true)}
                >
                  <Plus className="mr-1" size={14} />
                  Add Manually
                </Button>
              </div>
            </div>
          )}
          {filteredTransactions.length > 0 && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full group" asChild>
                <Link to="/transactions" className="flex items-center justify-center">
                  View All Transactions
                  <ArrowRight size={14} className="ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
