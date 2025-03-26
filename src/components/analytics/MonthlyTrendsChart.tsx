
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { MonthlyData } from '@/services/AnalyticsService';

interface MonthlyTrendsChartProps {
  monthlyData: MonthlyData[];
}

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
      <CardHeader>
        <CardTitle className="text-xl font-medium">Monthly Spending Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyData.length > 0 ? (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value: number) => formatCurrency(value).replace(/[^0-9.]/g, '')} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="total" name="Spending" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No expense data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendsChart;
