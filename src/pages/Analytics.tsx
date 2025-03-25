
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import CategoryPill from '@/components/CategoryPill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INITIAL_TRANSACTIONS, Transaction } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { groupByMonth } from '@/lib/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4BC0C0', '#F87171', '#FB7185'];

const Analytics = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Load transactions from localStorage or use initial data
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
    }
  }, []);

  // Generate data for the category breakdown chart
  const getCategoryData = () => {
    const expensesByCategory = transactions
      .filter(t => t.amount < 0)
      .reduce((acc: Record<string, number>, transaction) => {
        const { category, amount } = transaction;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(amount);
        return acc;
      }, {});

    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Generate data for the monthly spending chart
  const getMonthlyData = () => {
    const grouped = groupByMonth(transactions.filter(t => t.amount < 0));
    
    return Object.entries(grouped).map(([month, txns]) => {
      const total = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      // Format month for display (YYYY-MM -> MMM YYYY)
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const formatted = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        month: formatted,
        total,
      };
    }).sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Get expense and income totals
  const getTotals = () => {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    return { income, expenses, savingsRate };
  };

  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const { income, expenses, savingsRate } = getTotals();

  // Get all unique categories
  const uniqueCategories = Array.from(new Set(transactions.filter(t => t.amount < 0).map(t => t.category)));

  // Calculate top spending categories
  const topCategories = [...categoryData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-2 rounded-md shadow-sm text-sm">
          <p className="font-medium">{payload[0].name || label}</p>
          <p className="text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                    <h3 className="text-2xl font-semibold text-green-500">{formatCurrency(income)}</h3>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <h3 className="text-2xl font-semibold text-red-500">{formatCurrency(expenses)}</h3>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                    <h3 className="text-2xl font-semibold text-primary">{savingsRate.toFixed(1)}%</h3>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-medium">Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {topCategories.length > 0 ? (
                    <div className="space-y-4">
                      {topCategories.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] + '33', color: COLORS[index % COLORS.length] }}>
                              {index + 1}
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(category.value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No expense data available</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-medium">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No expense data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {uniqueCategories.map(category => (
                    <CategoryPill key={category} category={category} />
                  ))}
                </div>
                
                {categoryData.length > 0 ? (
                  <div className="space-y-4">
                    {categoryData.map((category) => (
                      <div key={category.name} className="bg-card rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CategoryPill category={category.name} />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(category.value / expenses) * 100}%` 
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {((category.value / expenses) * 100).toFixed(1)}% of total expenses
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No expense data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends">
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
                        <YAxis tickFormatter={(value) => formatCurrency(value).replace(/[^0-9.]/g, '')} />
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
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default Analytics;
