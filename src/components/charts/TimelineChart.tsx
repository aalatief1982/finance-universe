
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimePeriodData } from '@/types/transaction';
import { formatCurrency } from '@/utils/format-utils';

interface TimelineChartProps {
  data: TimePeriodData[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, 'USD').replace('.00', '')}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={formatDate}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Income"
                stackId="1"
                stroke="#4CAF50" 
                fill="#4CAF50" 
                fillOpacity={0.5}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                name="Expenses"
                stackId="2"
                stroke="#F44336" 
                fill="#F44336"
                fillOpacity={0.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
