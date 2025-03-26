
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { AnalyticsTotals } from '@/services/AnalyticsService';
import { ArrowDown, ArrowUp, DollarSign, PiggyBank, CreditCard } from 'lucide-react';
import { CHART_COLORS } from '@/constants/analytics';

interface SummaryCardsProps {
  totals: AnalyticsTotals;
}

const SummaryCards = ({ totals }: SummaryCardsProps) => {
  const { income, expenses, savingsRate } = totals;
  
  // Determine if savings rate is positive (good) or negative (bad)
  const isPositiveSavings = savingsRate > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign size={16} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-green-500">{formatCurrency(income)}</h3>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUp size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">12% </span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <CreditCard size={16} className="text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-red-500">{formatCurrency(expenses)}</h3>
          <div className="mt-2 flex items-center text-sm">
            <ArrowDown size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">3% </span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <PiggyBank size={16} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold" style={{ color: isPositiveSavings ? CHART_COLORS[1] : CHART_COLORS[3] }}>
            {savingsRate.toFixed(1)}%
          </h3>
          <div className="mt-2 flex items-center text-sm">
            {isPositiveSavings ? (
              <>
                <ArrowUp size={16} className="text-green-500 mr-1" />
                <span className="text-green-500 font-medium">Good savings</span>
              </>
            ) : (
              <>
                <ArrowDown size={16} className="text-red-500 mr-1" />
                <span className="text-red-500 font-medium">Needs improvement</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
