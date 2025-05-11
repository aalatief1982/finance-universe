
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CategoryPill from '@/components/CategoryPill';
import { formatCurrency } from '@/lib/formatters';
import { CategoryData } from '@/services/AnalyticsService';

interface CategoryBreakdownProps {
  categories: string[];
  categoryData: CategoryData[];
  totalExpenses: number;
}

const CategoryBreakdown = ({ categories, categoryData, totalExpenses }: CategoryBreakdownProps) => {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="p-3">
        <CardTitle className="text-lg font-medium">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map(category => (
            <CategoryPill key={category} category={category} />
          ))}
        </div>
        
        {categoryData.length > 0 ? (
          <div className="space-y-3">
            {categoryData.map((category) => (
              <div key={category.name} className="bg-card rounded-lg p-2.5 border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CategoryPill category={category.name} />
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(category.value)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ 
                      width: `${(category.value / totalExpenses) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((category.value / totalExpenses) * 100).toFixed(1)}% of total expenses
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8 text-sm">No expense data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdown;
