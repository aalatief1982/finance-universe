
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4BC0C0', '#F87171', '#FB7185'];
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

const ExpenseChart = ({ expensesByCategory = [], expensesBySubcategory = [] }: ExpenseChartProps) => {
  const [activeTab, setActiveTab] = useState('category');

  const limitedCategoryData = expensesByCategory.slice(0, 5);

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
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-medium">Expense Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="category">By Category</TabsTrigger>
              <TabsTrigger value="subcategory">Subcategories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="category" className="pt-2">
              {hasExpensesByCategory ? (
                <div className="h-[300px] w-full">
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
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {limitedCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Math.abs(Number(value)))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No category data available</p>
              )}
            </TabsContent>
            
            <TabsContent value="subcategory" className="pt-2">
              {hasExpensesBySubcategory ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesBySubcategory} layout="vertical" margin={CHART_MARGIN}>
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(Math.abs(value)).replace(/[^0-9.]/g, '')} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No subcategory data available</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseChart;
