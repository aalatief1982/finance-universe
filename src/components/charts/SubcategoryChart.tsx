/**
 * @file SubcategoryChart.tsx
 * @description UI component for SubcategoryChart.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type CategoricalChartState,
  type TooltipProps,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { getChartColor } from '@/utils/color-utils';
import { chunkSubcategoryData, type Item } from './subcategory-utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface SubcategoryChartProps {
  data: Item[];
}

const CHART_MARGIN = { top: 20, right: 20, left: 20, bottom: 20 };

const BarTooltip = (total: number) => {
  const BarTooltipRenderer = (
    { active, payload }: TooltipProps<number, string> & CategoricalChartState
  ) => {
    if (active && payload && payload.length) {
      const firstPayload = payload[0]?.payload as { name?: string; value?: number } | undefined;
      const name = firstPayload?.name ?? '';
      const value = firstPayload?.value ?? 0;
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

  BarTooltipRenderer.displayName = 'BarTooltip';
  return BarTooltipRenderer;
};

type AxisTickProps = { x: number; y: number; payload: { value: string | number } };

const YAxisTick = ({ x, y, payload }: AxisTickProps) => {
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

const SubcategoryBarChart = ({ items, t }: { items: Item[]; t: (key: string) => string }) => {
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
  } catch (err: unknown) {
    if (import.meta.env.MODE === 'development') {
      console.warn('[SubcategoryChart] Failed to render chart', err);
    }
    return (
      <p className="text-center text-muted-foreground py-12">{t('chart.unableToRender')}</p>
    );
  }
};

const SubcategoryChart: React.FC<SubcategoryChartProps> = ({ data }) => {
  const { t } = useLanguage();
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
        <CardTitle className="text-xl font-medium">{t('home.subcategory')}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <div className="h-[300px] w-full" role="img" aria-label={t('chart.subcategories')}>
              <SubcategoryBarChart items={current} t={t} />
            </div>
            {chunks.length > 1 && (
              <div className="flex justify-center items-center mt-2 gap-2">
                <button
                  aria-label={t('chart.previous')}
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1 disabled:opacity-50"
                >
                  ‹
                </button>
                <div className="flex gap-1">
                  {chunks.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={
                        i === page
                          ? 'w-2 h-2 rounded-full bg-primary'
                          : 'w-2 h-2 rounded-full bg-border'
                      }
                      aria-label={t('chart.pageN').replace('{n}', String(i + 1))}
                    />
                  ))}
                </div>
                <button
                  aria-label={t('chart.next')}
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
          <p className="text-center text-muted-foreground py-12">{t('chart.noDataAvailable')}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SubcategoryChart;
