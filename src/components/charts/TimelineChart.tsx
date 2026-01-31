/**
 * @file TimelineChart.tsx
 * @description UI component for TimelineChart.
 *
 * @module components/charts/TimelineChart
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '@/utils/format-utils';
import { getUserSettings } from '@/utils/storage-utils';
import { TimePeriodData } from '@/types/transaction';

interface TimelineChartProps {
  data: TimePeriodData[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('default', { month: 'short', day: '2-digit' });
  };

  return (
    <div className="h-[270px] w-full">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, getUserSettings().currency || 'USD').replace('.00', '')}
              width={45}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value, getUserSettings().currency || 'USD'), '']}
              labelFormatter={formatDate}
            />
            <Legend 
              wrapperStyle={{fontSize: "11px", paddingTop: "5px"}}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              name="Income"
              stroke="#27AE60" 
              fill="#27AE60" 
              strokeWidth={2}
              dot={{r: 2}}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              name="Expenses"
              stroke="#DC3545" 
              fill="#DC3545"
              strokeWidth={2}
              dot={{r: 2}}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TimelineChart;
