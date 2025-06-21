
import React from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Transaction } from '@/types/transaction';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CategoryPill from '@/components/CategoryPill';

interface TransactionTableProps {
  transactions: Transaction[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRowClick: (transaction: Transaction) => void;
}

const TransactionTable = ({
  transactions,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
}: TransactionTableProps) => {
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer flex items-center"
              onClick={() => onSort('date')}
            >
              <span>Date</span>
              {renderSortIcon('date')}
            </TableHead>
            <TableHead 
              className="cursor-pointer flex items-center"
              onClick={() => onSort('title')}
            >
              <span>Description</span>
              {renderSortIcon('title')}
            </TableHead>
            <TableHead 
              className="cursor-pointer flex items-center"
              onClick={() => onSort('category')}
            >
              <span>Category</span>
              {renderSortIcon('category')}
            </TableHead>
            <TableHead 
              className="cursor-pointer flex items-center text-right"
              onClick={() => onSort('amount')}
            >
              <span>Amount</span>
              {renderSortIcon('amount')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction, idx) => (
              <TableRow
                key={transaction.id || idx}
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => onRowClick(transaction)}
              >
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.title}</TableCell>
                <TableCell>
                  <CategoryPill category={transaction.category} />
                </TableCell>
                <TableCell className={`text-right font-medium ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(transaction.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTable;
