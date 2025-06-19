import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface Item {
  name: string;
  value: number;
}

interface SubcategoryChartProps {
  data: Item[];
}

const CHART_MARGIN = { top: 20, right: 20, left: 20, bottom: 20 };

const BarTooltip = (total: number) => ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    const percent = total ? ((value / total) * 100).toFixed(1) : null;
    return (
      <div className="bg-popover border border-border p-2 rounded-md shadow-sm text-sm">
        <p className="font-medium">{name}</p>
        <p className="text-primary">
          {formatCurrency(Math.abs(value))}
          {percent ? ` • ${percent}%` : ''}
        </p>
      </div>
    );
  }
  return null;
};

const YAxisTick = ({ x, y, payload }: any) => {
  const text = String(payload.value);
  const truncated = text.length > 10 ? `${text.slice(0, 10)}…` : text;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{text}</title>
      <text x={-4} y={0} dy={4} textAnchor="end" className="text-xs fill-foreground">
        {truncated}
      </text>
    </g>
  );
};

const SubcategoryChart: React.FC<SubcategoryChartProps> = ({ data }) => {
  const total = data.reduce((sum, c) => sum + c.value, 0);
  const hasData = data.length > 0;

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-medium">Subcategory</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[300px] w-full" role="img" aria-label="Expenses by subcategory bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={CHART_MARGIN}>
                <XAxis type="number" tickFormatter={(value) => formatCurrency(Math.abs(value)).replace(/[^0-9.]/g, '')} />
                <YAxis type="category" dataKey="name" width={100} tick={YAxisTick} />
                <Tooltip content={BarTooltip(total)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No data available yet. Try adding a few transactions first.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SubcategoryChart;
