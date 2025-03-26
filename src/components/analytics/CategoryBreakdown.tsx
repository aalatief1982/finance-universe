
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
      <CardHeader>
        <CardTitle className="text-xl font-medium">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <CategoryPill key={category} category={category} />
          ))}
        </div>
        
        {categoryData.length > 0 ? (
          <div className="space-y-4">
            {categoryData.map((category) => (
              <div key={category.name} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CategoryPill category={category.name} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(category.value)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
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
          <p className="text-center text-muted-foreground py-12">No expense data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdown;
