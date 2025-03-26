
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
      <CardHeader>
        <CardTitle className="text-xl font-medium">Top Spending Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length > 0 ? (
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: colors[index % colors.length] + '33', color: colors[index % colors.length] }}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(category.value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No expense data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSpendingCategories;
