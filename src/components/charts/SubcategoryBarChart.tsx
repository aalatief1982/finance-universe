import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface SubcategoryBarChartProps {
  data: Array<{
    subcategory: string;
    amount: number;
  }>;
  onSubcategoryClick?: (subcategory: string) => void;
  className?: string;
}

const SubcategoryBarChart: React.FC<SubcategoryBarChartProps> = ({
  data,
  onSubcategoryClick,
  className
}) => {
  return (
    <div className={cn('w-full h-[300px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subcategory" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `$${Math.abs(value).toFixed(2)}`}
            labelFormatter={(label) => `Subcategory: ${label}`}
          />
          <Bar
            dataKey="amount"
            fill="#8884d8"
            onClick={(entry) => onSubcategoryClick?.(entry.subcategory)}
            className="cursor-pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubcategoryBarChart;
