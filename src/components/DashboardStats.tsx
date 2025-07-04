
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
<div className="grid grid-cols-3 gap-2 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="overflow-hidden border border-border" role="button">
                <CardContent className="p-[var(--card-padding)]">
                  <div className="flex justify-between items-start">
                    <p className="flex-1 text-center text-sm font-medium text-muted-foreground">Income</p>
                    <ArrowUpCircle className="text-green-600" size={20} />
                  </div>
                  <h3 className="mt-1 text-left text-lg font-semibold text-green-500">{formatValue(income)}</h3>
                  {renderSubtitle(income)}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Click to see transactions for this period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="overflow-hidden border border-border" role="button">
                <CardContent className="p-[var(--card-padding)]">
                  <div className="flex justify-between items-start">
                    <p className="flex-1 text-center text-sm font-medium text-muted-foreground">Expenses</p>
                    <ArrowDownCircle className="text-red-600" size={20} />
                  </div>
                  <h3 className="mt-1 text-left text-lg font-semibold text-red-500">{formatValue(Math.abs(expenses))}</h3>
                  {renderSubtitle(expenses)}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Click to see transactions for this period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="overflow-hidden border border-border" role="button">
                <CardContent className="p-[var(--card-padding)]">
                  <div className="flex justify-between items-start">
                    <p className="flex-1 text-center text-sm font-medium text-muted-foreground">Balance</p>
                    <div className={`${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {balance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                  </div>
                  <h3 className={`mt-1 text-left text-lg font-semibold ${balance >= 0 ? 'text-primary' : 'text-red-500'}`}>{formatValue(balance)}</h3>
                  {renderSubtitle(balance)}
                  {previousBalance !== undefined && (
                    <p className={`text-xs flex items-center mt-1 ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositiveChange ? (
                        <TrendingUp size={14} className="mr-1" />
                      ) : (
                        <TrendingDown size={14} className="mr-1" />
                      )}
                      {Math.abs(balanceChange).toFixed(1)}% from last month
                    </p>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Click to see transactions for this period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
};

export default DashboardStats;
