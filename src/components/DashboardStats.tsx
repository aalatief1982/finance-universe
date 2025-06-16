
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

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
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="overflow-hidden border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Income</p>
                <h3 className="text-2xl font-semibold text-green-500">{formatCurrency(income)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <ArrowUpCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="overflow-hidden border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Expenses</p>
                <h3 className="text-2xl font-semibold text-red-500">{formatCurrency(Math.abs(expenses))}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <ArrowDownCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="overflow-hidden border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Balance</p>
                <h3 className={`text-2xl font-semibold ${balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {formatCurrency(balance)}
                </h3>
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
              </div>
              <div className={`h-12 w-12 rounded-full ${balance >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'} flex items-center justify-center`}>
                {balance >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardStats;
