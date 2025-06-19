
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { Info } from 'lucide-react';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ExpenseByCategory {
  name: string;
  value: number;
}

interface ExpenseBySubcategory {
  name: string;
  value: number;
}

interface ExpenseChartProps {
  expensesByCategory: ExpenseByCategory[];
  expensesBySubcategory: ExpenseBySubcategory[];
}

const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#6c757d'];
const CHART_MARGIN = { top: 20, right: 20, left: 20, bottom: 20 };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-2 rounded-md shadow-sm text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{formatCurrency(Math.abs(payload[0].value))}</p>
      </div>
    );
  }

  return null;
};

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

const ExpenseChart = ({ expensesByCategory = [], expensesBySubcategory = [] }: ExpenseChartProps) => {
  const [activeTab, setActiveTab] = useState('category');

  const limitedCategoryData = expensesByCategory.slice(0, 5);
  const totalExpense = limitedCategoryData.reduce((sum, c) => sum + c.value, 0);

  const totalSubcategory = expensesBySubcategory.reduce((sum, c) => sum + c.value, 0);


  // Safe check for empty data
  const hasExpensesByCategory = Array.isArray(limitedCategoryData) && limitedCategoryData.length > 0;
  const hasExpensesBySubcategory = Array.isArray(expensesBySubcategory) && expensesBySubcategory.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-0 flex items-center justify-between">
          <CardTitle className="text-xl font-medium flex items-center gap-1">
            Expense Analysis
            <TooltipProvider>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>Categorized view of your spending</TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 border-b">
              <TabsTrigger value="category" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">By Category</TabsTrigger>
              <TabsTrigger
                value="subcategory"
                disabled={!hasExpensesBySubcategory}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors"
                title={hasExpensesBySubcategory ? undefined : 'No data to show yet'}
              >
                Subcategories
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="category" className="pt-2">
              {hasExpensesByCategory ? (
                limitedCategoryData.length > 1 ? (
                  <div className="h-[300px] w-full" role="img" aria-label="Expenses by category donut chart">

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={CHART_MARGIN}>
                        <Pie
                          data={limitedCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                          isAnimationActive={true}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {limitedCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-sm fill-foreground"
                        >
                          {formatCurrency(totalExpense)}
                        </text>
                        <Tooltip formatter={(value) => formatCurrency(Math.abs(Number(value)))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Not enough data to show a meaningful breakdown</p>

                )
              ) : (
                <p className="text-center text-muted-foreground py-12">No data available yet. Try adding a few transactions first.</p>
              )}
            </TabsContent>
            
            <TabsContent value="subcategory" className="pt-2">
              {hasExpensesBySubcategory ? (
                <div className="h-[300px] w-full" role="img" aria-label="Expenses by subcategory bar chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesBySubcategory} layout="vertical" margin={CHART_MARGIN}>
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(Math.abs(value)).replace(/[^0-9.]/g, '')} />
                      <YAxis type="category" dataKey="name" width={100} tick={YAxisTick} />
                      <Tooltip content={BarTooltip(totalSubcategory)} />
                      <Bar dataKey="value" radius={[4, 4, 4, 4]} isAnimationActive>
                        {expensesBySubcategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data available yet. Try adding a few transactions first.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseChart;
