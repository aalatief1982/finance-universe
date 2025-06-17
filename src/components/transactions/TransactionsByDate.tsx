
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import TransactionActions from './TransactionActions';

interface TransactionsByDateProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

const TransactionsByDate: React.FC<TransactionsByDateProps> = ({
  transactions
}) => {
  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date.split('T')[0]; // Get YYYY-MM-DD part
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      // Fallback for any date parsing issues
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date} className="space-y-2">
          <h3 className="font-medium text-muted-foreground">
            {formatDate(date)}
          </h3>
          
          <div className="space-y-2">
           {groupedTransactions[date].map((transaction, index) => {
  if (!transaction.id?.trim()) {
    console.warn('⚠️ Empty or invalid transaction.id:', transaction);
  }

  return (
    <Card key={transaction.id?.trim() || `txn-${date}-${index}`} className="p-[var(--card-padding)]">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h4 className="font-medium">{transaction.title}</h4>
          <p className="text-sm text-muted-foreground">{transaction.category}</p>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-lg font-medium ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {formatCurrency(transaction.amount)}
          </span>

          <TransactionActions 
            transaction={transaction} 
            variant="dropdown" 
          />
        </div>
      </div>
    </Card>
  );
})}

          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsByDate;
