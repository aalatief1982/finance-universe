
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySummary } from '@/types/transaction';

interface CategoryBreakdownChartProps {
  data: CategorySummary[];
}

const COLORS = ['#0097a0', '#FF6B3C', '#27AE60', '#DC3545', '#17A2B8', '#FFC107', '#6E48AA', '#f28b82'];

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ data }) => {
  const chartData = data.slice(0, 8); // Limit to 8 categories for better visualization
  
  return (
    <div className="h-[270px] w-full">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center" 
              wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryBreakdownChart;
