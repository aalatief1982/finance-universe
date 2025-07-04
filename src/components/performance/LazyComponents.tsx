import { lazy } from 'react';

// Lazy load heavy components for better performance
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyImportTransactions = lazy(() => import('@/pages/ImportTransactions'));
export const LazyImportTransactionsNER = lazy(() => import('@/pages/ImportTransactionsNER'));
export const LazyProcessSmsMessages = lazy(() => import('@/pages/ProcessSmsMessages'));
export const LazyReviewSmsTransactions = lazy(() => import('@/pages/ReviewSmsTransactions'));
export const LazyVendorMapping = lazy(() => import('@/pages/VendorMapping'));
export const LazyTrainModel = lazy(() => import('@/pages/TrainModel'));
export const LazyExpenseChart = lazy(() => import('@/components/ExpenseChart'));
export const LazyTransactionTable = lazy(() => import('@/components/TransactionTable'));
export const LazyCategoryChart = lazy(() => import('@/components/charts/CategoryChart'));
export const LazyMonthlyTrendsChart = lazy(() => import('@/components/analytics/MonthlyTrendsChart'));
export const LazyCategoryPieChart = lazy(() => import('@/components/analytics/CategoryPieChart'));
export const LazyCategoryBreakdownChart = lazy(() => import('@/components/charts/CategoryBreakdownChart'));
export const LazyTimelineChart = lazy(() => import('@/components/charts/TimelineChart'));
export const LazyNetBalanceChart = lazy(() => import('@/components/charts/NetBalanceChart'));

// Lazy load wireframe components
export const LazyExpenseTrackerWireframes = lazy(() => import('@/components/wireframes/ExpenseTrackerWireframes'));

// Lazy load settings components
export const LazyCategorySettings = lazy(() => import('@/components/settings/CategorySettings'));
export const LazyDataManagementSettings = lazy(() => import('@/components/settings/DataManagementSettings'));
export const LazyLearningEngineSettings = lazy(() => import('@/components/settings/LearningEngineSettings'));
export const LazyNotificationSettings = lazy(() => import('@/components/settings/NotificationSettings'));
export const LazyPrivacySettings = lazy(() => import('@/components/settings/PrivacySettings'));