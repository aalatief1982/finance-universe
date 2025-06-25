import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { getChartColor } from '@/utils/color-utils';


const RADIAN = Math.PI / 180;

const renderLabelLine = ({ cx, cy, midAngle, outerRadius }: any) => {
  const radius = outerRadius + 12;
  const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN);
  const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN);
  const ex = cx + radius * Math.cos(-midAngle * RADIAN);
  const ey = cy + radius * Math.sin(-midAngle * RADIAN);
  return <path d={`M${sx},${sy}L${ex},${ey}`} stroke="currentColor" fill="none" strokeWidth={1} />;
};

const renderLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};


interface CategoryItem {
  name: string;
  value: number;
}

interface CategoryChartProps {
  data: CategoryItem[];
}

// Extra bottom spacing is required for the legend, so we provide an equal
// top margin to keep the donut vertically centered within the chart.
const CHART_MARGIN = { top: 40, right: 20, left: 20, bottom: 40 };

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
              className="h-[300px] w-full"
              role="img"
              aria-label="Expenses by category donut chart"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={CHART_MARGIN}>
                  <Pie
                    data={limited}
                    cx="50%"
                    cy="50%"
                    labelLine={renderLabelLine}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive

                    label={renderLabel}

                  >
                    {limited.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-foreground">
                    {formatCurrency(total)}
                  </text>
                  <Tooltip formatter={(value) => formatCurrency(Math.abs(Number(value)))} />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{
                      fontSize: '12px',
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'center',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflowX: 'auto',
                    }}
                  />
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
