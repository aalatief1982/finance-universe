import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { CHART_COLORS } from '@/constants/analytics';

interface CategoryItem {
  name: string;
  value: number;
}

interface CategoryChartProps {
  data: CategoryItem[];
}

const CHART_MARGIN = { top: 20, right: 20, left: 20, bottom: 40 };

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const limited = data.slice(0, 5);
  const total = limited.reduce((sum, c) => sum + c.value, 0);
  const hasData = limited.length > 0;

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-medium">Category</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          limited.length > 1 ? (
            <div
              className="h-[300px] w-full flex items-center"
              role="img"
              aria-label="Expenses by category donut chart"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={CHART_MARGIN}>
                  <Pie
                    data={limited}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {limited.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-foreground">
                    {formatCurrency(total)}
                  </text>
                  <Tooltip formatter={(value) => formatCurrency(Math.abs(Number(value)))} />
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Not enough data to show a meaningful breakdown</p>
          )
        ) : (
          <p className="text-center text-muted-foreground py-12">No data available yet. Try adding a few transactions first.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
