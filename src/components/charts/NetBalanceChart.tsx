import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import { TimePeriodData } from '@/types/transaction';
import { formatCurrency } from '@/utils/format-utils';

interface NetBalanceChartProps {
  data: (TimePeriodData & { balance: number })[];
}

const NetBalanceChart: React.FC<NetBalanceChartProps> = ({ data }) => {
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
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v, 'USD').replace('.00', '')} width={60} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), '']} labelFormatter={formatDate} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
            <Bar dataKey="income" name="Income" stackId="a" fill="#27AE60" />
            <Bar dataKey="expense" name="Expenses" stackId="a" fill="#DC3545" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default NetBalanceChart;
