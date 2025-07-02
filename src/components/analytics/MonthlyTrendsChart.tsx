
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { MonthlyData } from '@/services/AnalyticsService';

interface MonthlyTrendsChartProps {
  monthlyData: MonthlyData[];
}

const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#6c757d'];

const MonthlyTrendsChart = ({ monthlyData }: MonthlyTrendsChartProps) => {
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-2 rounded-md shadow-sm text-sm">
          <p className="font-medium">{label}</p>
          <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="p-3">
        <CardTitle className="text-lg font-medium">Monthly Spending Trends</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {monthlyData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 15, right: 10, left: 10, bottom: 30 }}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis 
                  tickFormatter={(value: number) => formatCurrency(value).replace(/[^0-9.]/g, '')}
                  fontSize={12}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="total" name="Spending" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8 text-sm">No expense data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendsChart;
