
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardStatsProps {
  income: number;
  expenses: number;
  balance: number;
  previousBalance?: number;
}

const DashboardStats = ({
  income,
  expenses,
  balance,
  previousBalance,
}: DashboardStatsProps) => {
  const balanceChange = previousBalance !== undefined 
    ? ((balance - previousBalance) / Math.abs(previousBalance || 1)) * 100
    : 0;
  
  const isPositiveChange = balanceChange >= 0;

  const formatValue = (val: number) =>
    Number.isFinite(val) ? formatCurrency(val) : '--';
  const renderSubtitle = (val: number) =>
    Number.isFinite(val) ? null : (
      <p className="text-xs text-muted-foreground">No data yet</p>
    );
  
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="text-center">
        <CardContent className="p-4">
          <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-green-100 rounded-full">
            <ArrowUpCircle className="text-green-600" size={16} />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Income</p>
          <h3 className="text-xl font-bold text-green-600">{formatValue(income)}</h3>
        </CardContent>
      </Card>
      
      <Card className="text-center">
        <CardContent className="p-4">
          <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-red-100 rounded-full">
            <ArrowDownCircle className="text-red-600" size={16} />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Expenses</p>
          <h3 className="text-xl font-bold text-red-600">{formatValue(Math.abs(expenses))}</h3>
        </CardContent>
      </Card>
      
      <Card className="text-center">
        <CardContent className="p-4">
          <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-full">
            {balance >= 0 ? <TrendingUp className="text-blue-600" size={16} /> : <TrendingDown className="text-red-600" size={16} />}
          </div>
          <p className="text-sm text-muted-foreground mb-1">Balance</p>
          <h3 className={`text-xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatValue(balance)}</h3>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
