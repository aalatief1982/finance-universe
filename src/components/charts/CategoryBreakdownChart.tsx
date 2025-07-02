
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySummary } from '@/types/transaction';
import { getChartColor } from '@/utils/color-utils';

interface CategoryBreakdownChartProps {
  data: CategorySummary[];
}


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
                <Cell key={`cell-${index}`} fill={getChartColor(index)} />
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
