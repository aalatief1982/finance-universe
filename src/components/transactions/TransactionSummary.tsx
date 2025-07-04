
import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-utils';
import { TransactionSummary as TransactionSummaryType } from '@/types/transaction';

interface TransactionSummaryProps {
  summary: TransactionSummaryType;
}

const TransactionSummary: React.FC<TransactionSummaryProps> = ({ summary }) => {
  const { income, expenses, balance } = summary;
  
  const balanceChange = balance >= 0 
    ? { icon: ArrowUpRight, color: 'text-success', bgColor: 'bg-success/10', label: 'Positive balance' }
    : { icon: ArrowDownRight, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Negative balance' };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
              <h3 className="text-2xl font-bold text-success">{formatCurrency(income)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
              <h3 className="text-2xl font-bold text-destructive">{formatCurrency(expenses)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Balance</p>
              <h3 className="text-2xl font-bold">{formatCurrency(balance)}</h3>
            </div>
            <div className={`h-12 w-12 rounded-full ${balanceChange.bgColor} flex items-center justify-center`}>
              <DollarSign className={`h-6 w-6 ${balanceChange.color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionSummary;
