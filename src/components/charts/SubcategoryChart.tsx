import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { getChartColor } from '@/utils/color-utils';

interface Item {
  name: string;
  value: number;
}

interface SubcategoryChartProps {
  data: Item[];
}

export const MAX_SUBCATEGORIES = 6;

export const chunkSubcategoryData = (items: Item[], size: number = MAX_SUBCATEGORIES) => {
  const chunks: Item[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

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

const SubcategoryBarChart = ({ items }: { items: Item[] }) => {
  const total = items.reduce((sum, c) => sum + c.value, 0);

  try {
    return (
      <ResponsiveContainer width="100%" height="100%">
         <BarChart data={items} margin={CHART_MARGIN} layout="vertical">
          <XAxis
            type="number"
            domain={[0, 'dataMax']}
            tickFormatter={(value) =>
              formatCurrency(Math.abs(value)).replace(/[^0-9.]/g, '')
            }
          />
          <YAxis type="category" dataKey="name" width={100} tick={YAxisTick} />
          <Tooltip content={BarTooltip(total)} />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} isAnimationActive>
            {items.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getChartColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.warn('[SubcategoryChart] Failed to render chart', err);
    }
    return (
      <p className="text-center text-muted-foreground py-12">Unable to render chart</p>
    );
  }
};

const SubcategoryChart: React.FC<SubcategoryChartProps> = ({ data }) => {
  const [page, setPage] = React.useState(0);
  const chunks = React.useMemo(() => chunkSubcategoryData(data), [data]);
  const current = chunks[page] || [];

  React.useEffect(() => {
    if (data.length === 0) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SubcategoryChart] No subcategory data provided');
      }
    }
  }, [data]);

  const hasData = current.length > 0;

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-medium">Subcategory</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <div className="h-[300px] w-full" role="img" aria-label="Expenses by subcategory bar chart">
              <SubcategoryBarChart items={current} />
            </div>
            {chunks.length > 1 && (
              <div className="flex justify-center items-center mt-2 space-x-2">
                <button
                  aria-label="Previous"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1 disabled:opacity-50"
              >
                ‹
              </button>
              <div className="flex space-x-1">
                {chunks.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={
                      i === page
                        ? 'w-2 h-2 rounded-full bg-primary'
                        : 'w-2 h-2 rounded-full bg-border'
                    }
                    aria-label={`Page ${i + 1}`}
                  />
                ))}
              </div>
              <button
                aria-label="Next"
                disabled={page === chunks.length - 1}
                onClick={() => setPage((p) => Math.min(chunks.length - 1, p + 1))}
                className="p-1 disabled:opacity-50"
              >
                ›
              </button>
            </div>
          )}
        </>
        ) : (
          <p className="text-center text-muted-foreground py-12">No data available yet. Try adding a few transactions first.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SubcategoryChart;
