import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

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
    <>
      {/* Income and Expense row */}
      <div className="col-span-3 grid grid-cols-2 gap-2">
        {/* Income Card */}
        <Card className="border-0 bg-green-50/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <ArrowUpCircle size={18} />
                </div>
                <h3 className="text-lg font-medium text-green-700">{formatCurrency(income)}</h3>
              </div>
              <span className="text-xs text-green-600/60">USD</span>
            </div>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card className="border-0 bg-red-50/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <ArrowDownCircle size={18} />
                </div>
                <h3 className="text-lg font-medium text-red-700">{formatCurrency(Math.abs(expenses))}</h3>
              </div>
              <span className="text-xs text-red-600/60">USD</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Card - Full Width */}
      <div className="col-span-3">
        <Card className={cn(
          "border-0",
          balance >= 0 ? "bg-blue-50/50" : "bg-red-50/50"
        )}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  balance >= 0 ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                )}>
                  {balance >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div>
                  <h3 className={cn(
                    "text-lg font-medium",
                    balance >= 0 ? "text-blue-700" : "text-red-700"
                  )}>{formatCurrency(balance)}</h3>
                  {previousBalance !== undefined && (
                    <p className={cn(
                      "text-xs flex items-center gap-1",
                      isPositiveChange ? "text-green-600" : "text-red-600"
                    )}>
                      {isPositiveChange ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {Math.abs(balanceChange).toFixed(1)}% vs last month
                    </p>
                  )}
                </div>
              </div>
              <span className={cn(
                "text-xs",
                balance >= 0 ? "text-blue-600/60" : "text-red-600/60"
              )}>USD</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardStats;
