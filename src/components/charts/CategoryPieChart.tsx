import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

export interface CategoryPieChartProps {
  data: Array<{
    category: string;
    amount: number;
  }>;
  onCategoryClick?: (category: string) => void;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  onCategoryClick,
  className
}) => {
  return (
    <div className={cn('w-full h-[300px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
            nameKey="category"
            onClick={(entry) => onCategoryClick?.(entry.category)}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${Math.abs(value).toFixed(2)}`}
            labelFormatter={(label) => `Category: ${label}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryPieChart;
