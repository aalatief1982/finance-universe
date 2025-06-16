
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockTransactions } from '@/lib/mock-data';
import { Transaction } from '@/types/transaction';
import { AnalyticsService } from '@/services/AnalyticsService';
import { CHART_COLORS } from '@/constants/analytics';

// Component imports
import SummaryCards from '@/components/analytics/SummaryCards';
import TopSpendingCategories from '@/components/analytics/TopSpendingCategories';
import CategoryPieChart from '@/components/analytics/CategoryPieChart';
import CategoryBreakdown from '@/components/analytics/CategoryBreakdown';
import MonthlyTrendsChart from '@/components/analytics/MonthlyTrendsChart';

const Analytics = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Load transactions from localStorage or use initial data
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(mockTransactions as Transaction[]);
    }
  }, []);

  // Compute all analytics data
  const totals = AnalyticsService.getTotals(transactions);
  const categoryData = AnalyticsService.getCategoryData(transactions);
  const monthlyData = AnalyticsService.getMonthlyData(transactions);
  const uniqueCategories = AnalyticsService.getUniqueCategories(transactions);
  const topCategories = AnalyticsService.getTopCategories(categoryData, 3);

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
            <SummaryCards totals={totals} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopSpendingCategories 
                categories={topCategories} 
                totalExpenses={totals.expenses} 
                colors={CHART_COLORS} 
              />
              
              <CategoryPieChart 
                categoryData={categoryData} 
                colors={CHART_COLORS} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoryBreakdown 
              categories={uniqueCategories} 
              categoryData={categoryData} 
              totalExpenses={totals.expenses} 
            />
          </TabsContent>
          
          <TabsContent value="trends">
            <MonthlyTrendsChart monthlyData={monthlyData} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default Analytics;
