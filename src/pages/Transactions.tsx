
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import TransactionsByDate from '@/components/transactions/TransactionsByDate';
import EditTransactionDialog from '@/components/transactions/EditTransactionDialog';
import ResponsiveFAB from '@/components/dashboard/ResponsiveFAB';
import { useTransactionsState } from '@/hooks/useTransactionsState';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DatePicker } from '@/components/ui/date-picker';
import { CATEGORIES } from '@/lib/mock-data';
import { useNavigate } from 'react-router-dom';
import { logFirebaseOnlyEvent } from '@/utils/firebase-analytics';

const Transactions = () => {
  const [filter, setFilter] = React.useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigate = useNavigate();

  // Track screen view
  useEffect(() => {
    logFirebaseOnlyEvent('view_transactions', { timestamp: Date.now() });
  }, []);

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

  type Range = '' | 'day' | 'week' | 'month' | 'year' | 'custom';
  const defaultEnd = React.useMemo(() => new Date(), []);
  const defaultStart = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);

  const [range, setRange] = React.useState<Range>('custom');
  const [customStart, setCustomStart] = React.useState<Date | null>(defaultStart);
  const [customEnd, setCustomEnd] = React.useState<Date | null>(defaultEnd);
  
  const filteredTransactions = React.useMemo(() => {
    let result = transactions;

    if (range) {
      const now = new Date();
      let start = new Date(now);
      let end = new Date(now);

      switch (range) {
        case 'day':
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start.setDate(now.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          if (customStart) start = new Date(customStart);
          if (customEnd) end = new Date(customEnd);
          break;
      }

      const toDate = range === 'custom' ? end : now;

      result = result.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= toDate;
      });
    }

    // Filter by type using the type field directly
    result = result.filter(tx => {
      if (filter !== 'all' && tx.type !== filter) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return JSON.stringify(tx).toLowerCase().includes(query);
      }

      return true;
    });

    return result;
  }, [transactions, filter, searchQuery, range, customStart, customEnd]);
  
  return (
    <Layout withPadding={false} showBack fullWidth>
      <div className="container px-1">
      <PageHeader title={null} />


      <div className="sticky top-[var(--header-height)] z-10 bg-background px-[var(--page-padding-x)] pt-0 pb-2 -mt-[7px] space-y-2">

        <ToggleGroup
          type="single"
          value={range}
          onValueChange={val => setRange(val as Range)}
          className="w-full bg-muted p-1 text-muted-foreground rounded-md"
        >
          {['day', 'week', 'month', 'year'].map(r => (
            <ToggleGroupItem
              key={r}
              value={r}
              className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem
            value="custom"
            className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
          >
            Custom
          </ToggleGroupItem>
        </ToggleGroup>

        {range === 'custom' && (
          <div className="flex items-center justify-center gap-2 animate-in fade-in">
            <DatePicker date={customStart} setDate={setCustomStart} placeholder="Start" />
            <DatePicker date={customEnd} setDate={setCustomEnd} placeholder="End" />
          </div>
        )}

        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={val => setFilter(val as 'all' | 'income' | 'expense' | 'transfer')}
          className="w-full bg-muted p-1 text-muted-foreground rounded-md"
        >
          {['all', 'income', 'expense', 'transfer'].map(f => (
            <ToggleGroupItem
              key={f}
              value={f}
              className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Input
          placeholder="Search transactions..."
          className="h-8 text-sm rounded-md w-full px-3 py-1.5 bg-secondary-light border-secondary/20 focus-visible:border-secondary focus-visible:ring-secondary"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="px-[var(--page-padding-x)]">
        <div className="pt-2 pb-24 mt-1">
          {filteredTransactions.length > 0 ? (
            <TransactionsByDate transactions={filteredTransactions} />
          ) : (
          <div className="flex flex-col items-center justify-center py-[var(--section-gap)] text-center">
            <p className="text-muted-foreground mb-3">No transactions found</p>
          </div>
        )}
        </div>
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
      
      <ResponsiveFAB onClick={() => navigate('/edit-transaction')} />
    </Layout>
  );
};

export default Transactions;
