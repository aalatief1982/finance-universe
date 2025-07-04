
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
                <CardContent className="p-3">
                  <div className="flex items-center justify-center mb-2">
                    <ArrowUpCircle className="text-green-600 mr-2" size={18} strokeWidth={2.5} />
                    <p className="font-bold text-sm text-foreground">Income</p>
                  </div>
                  <h3 className="text-left text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-green-500 truncate leading-tight">
                    {formatValue(income)}
                  </h3>
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
                <CardContent className="p-3">
                  <div className="flex items-center justify-center mb-2">
                    <ArrowDownCircle className="text-red-600 mr-2" size={18} strokeWidth={2.5} />
                    <p className="font-bold text-sm text-foreground">Expenses</p>
                  </div>
                  <h3 className="text-left text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-red-500 truncate leading-tight">
                    {formatValue(Math.abs(expenses))}
                  </h3>
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
                <CardContent className="p-3">
                  <div className="flex items-center justify-center mb-2">
                    <div className={`mr-2 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {balance >= 0 ? <TrendingUp size={18} strokeWidth={2.5} /> : <TrendingDown size={18} strokeWidth={2.5} />}
                    </div>
                    <p className="font-bold text-sm text-foreground">Balance</p>
                  </div>
                  <h3 className={`text-left text-sm sm:text-base md:text-lg lg:text-xl font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'} truncate leading-tight`}>
                    {formatValue(balance)}
                  </h3>
                  {renderSubtitle(balance)}
                  {previousBalance !== undefined && (
                    <p className={`text-xs flex items-center mt-1 ${isPositiveChange ? 'text-green-500' : 'text-red-500'} truncate`}>
                      {isPositiveChange ? (
                        <TrendingUp size={12} className="mr-1 flex-shrink-0" />
                      ) : (
                        <TrendingDown size={12} className="mr-1 flex-shrink-0" />
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
