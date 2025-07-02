
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { CategoryData } from '@/services/AnalyticsService';

interface TopSpendingCategoriesProps {
  categories: CategoryData[];
  totalExpenses: number;
  colors: string[];
}

const TopSpendingCategories = ({ categories, totalExpenses, colors }: TopSpendingCategoriesProps) => {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="p-3">
        <CardTitle className="text-lg font-medium">Top Spending Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs" 
                    style={{ backgroundColor: colors[index % colors.length] + '20', color: colors[index % colors.length] }}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
                <span className="font-medium text-sm">{formatCurrency(category.value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6 text-sm">No expense data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSpendingCategories;
