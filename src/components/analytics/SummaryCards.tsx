
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { AnalyticsTotals } from '@/services/AnalyticsService';

interface SummaryCardsProps {
  totals: AnalyticsTotals;
}

const SummaryCards = ({ totals }: SummaryCardsProps) => {
  const { income, expenses, savingsRate } = totals;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            <h3 className="text-2xl font-semibold text-green-500">{formatCurrency(income)}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <h3 className="text-2xl font-semibold text-red-500">{formatCurrency(expenses)}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
            <h3 className="text-2xl font-semibold text-primary">{savingsRate.toFixed(1)}%</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
