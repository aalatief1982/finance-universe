/**
 * @file Home.tsx
 * @description Dashboard home page for financial summaries, charts,
 *              and quick actions.
 *
 * @module pages/Home
 *
 * @responsibilities
 * 1. Filter transactions by date range for analytics
 * 2. Render summary cards and charts (category, time, net balance)
 * 3. Track screen view analytics
 * 4. Display FX-aware totals with unconverted transaction warnings
 *
 * @dependencies
 * - AnalyticsService.ts: totals and chart data helpers
 * - TransactionContext: transaction data source
 * - firebase-analytics.ts: screen view logging
 *
 * @review-tags
 * - @risk: summary calculations must exclude transfers where required
 * - @risk: FX aggregation must track unconverted transactions
 * - @performance: memoized aggregates on large transaction lists
 *
 * @review-checklist
 * - [ ] Transfers excluded from income/expense totals
 * - [ ] Date range filters include end date for custom ranges
 * - [ ] Charts receive consistent data ordering
 * - [ ] FX warning banner shows when transactions are unconverted
 */

import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import DashboardStats from "@/components/DashboardStats";
import TimelineChart from "@/components/charts/TimelineChart";
import NetBalanceChart from "@/components/charts/NetBalanceChart";
import CategoryChart from "@/components/charts/CategoryChart";
import SubcategoryChart from "@/components/charts/SubcategoryChart";
import ChartErrorBoundary from "@/components/charts/ChartErrorBoundary";
import UnconvertedWarningBanner from "@/components/dashboard/UnconvertedWarningBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/context/TransactionContext";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { TYPE_ICON_MAP } from "@/constants/typeIconMap";
import { CATEGORY_ICON_MAP } from "@/constants/categoryIconMap";
import { format } from "date-fns";

import ResponsiveFAB from "@/components/dashboard/ResponsiveFAB";
import { Transaction } from "@/types/transaction";
import { useUser } from "@/context/UserContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AnalyticsService } from "@/services/AnalyticsService";
import { DatePicker } from "@/components/ui/date-picker";
import { logFirebaseOnlyEvent } from "@/utils/firebase-analytics";
import { formatCurrency } from "@/lib/formatters";
import { getDefaultCurrency, getCurrencyOrAppFallback } from '@/utils/default-currency';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getHomeFilteredTransactions, getHomeSummary, HomeDateRange } from "@/utils/home-transactions";

const Home = () => {
  const { transactions } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  
  // State to dismiss the unconverted warning
  const [dismissedWarning, setDismissedWarning] = useState(false);

  // Track screen view
  useEffect(() => {
    logFirebaseOnlyEvent('view_home', { timestamp: Date.now() });
  }, []);

  type Range = HomeDateRange;
  const defaultEnd = React.useMemo(() => new Date(), []);
  const defaultStart = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);

  const [range, setRange] = React.useState<Range>("custom");
  const [customStart, setCustomStart] = React.useState<Date | null>(
    defaultStart,
  );
  const [customEnd, setCustomEnd] = React.useState<Date | null>(defaultEnd);
  const [activeTab, setActiveTab] = React.useState("trends");

  // Get user's default currency
  const settingsCurrency = getDefaultCurrency();
  const baseCurrency = user?.preferences?.currency || settingsCurrency || getCurrencyOrAppFallback();

  const handleAddTransaction = () => {
    navigate("/edit-transaction");
  };

  const filteredTransactions = React.useMemo(() => {
    return getHomeFilteredTransactions({
      transactions,
      baseCurrency,
      range,
      customStart,
      customEnd,
    });
  }, [transactions, baseCurrency, range, customStart, customEnd]);

  // Calculate FX-aware summary (EXCLUDES transfers from income/expense totals)
  const homeSummary = React.useMemo(() => {
    return getHomeSummary(filteredTransactions);
  }, [filteredTransactions]);

  const fxSummary = React.useMemo(() => {
    return AnalyticsService.getFxAwareTotals(filteredTransactions, baseCurrency);
  }, [filteredTransactions, baseCurrency]);

  if (import.meta.env.DEV) {
    console.debug('[CurrencySync][Home] stored default currency:', settingsCurrency, '| home baseCurrency:', baseCurrency);
    console.debug('[FX-DEBUG] Home.tsx | baseCurrency:', baseCurrency, '| income:', fxSummary.income, '| expenses:', fxSummary.expenses, '| unconvertedCount:', fxSummary.unconvertedCount);
  }

  // Calculate balance separately (income - expenses for display)
  const initials = firstName.charAt(0).toUpperCase();
  const formatDisplayTitle = (txn: Transaction) => {
    const base = txn.title?.trim() || "Transaction";
    return txn.type === "expense" ? `${base} (Expense)` : base;
  };

  const formatTxnDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEE, MMM dd");
    } catch {
      return "—";
    }
  };

  const analyticsTransactions = React.useMemo(() => {
    return filteredTransactions.map(({ effectiveAmount, isUnconverted, ...transaction }) => transaction);
  }, [filteredTransactions]);

  const expensesBySubcategory = React.useMemo(() => {
    try {
      return AnalyticsService.getFxAwareSubcategoryData(analyticsTransactions, baseCurrency);
    } catch {
      console.warn('[Home] Failed to get subcategory data');
      return [];
    }
  }, [analyticsTransactions, baseCurrency]);

  const expensesByCategory = React.useMemo(() => {
    try {
      return AnalyticsService.getFxAwareCategoryData(analyticsTransactions, baseCurrency);
    } catch {
      return [];
    }
  }, [analyticsTransactions, baseCurrency]);

  // FX-aware timeline data (EXCLUDES transfers)
  const timelineData = React.useMemo(() => {
    try {
      return AnalyticsService.getFxAwareTimelineData(analyticsTransactions, range || 'month', baseCurrency);
    } catch (err) {
      console.warn('[Home] Failed to compute timeline data:', err);
      return [];
    }
  }, [analyticsTransactions, range, baseCurrency]);

  return (
    <Layout withPadding={false} fullWidth>
      <div className="container px-1 pb-[calc(var(--bottom-nav-height,0px)+var(--safe-area-bottom)+0.5rem)]">
        <div className="px-[var(--page-padding-x)] pt-[clamp(0.375rem,1.2vh,0.875rem)] pb-1">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              {user?.avatar && <AvatarImage src={user.avatar} alt={firstName} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-semibold tracking-tight truncate">{`${greeting}, ${firstName}`}</h1>
          </div>
        </div>

        <div className="my-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(val) => { if (val) setRange(val as Range); }}
            className="w-full bg-muted p-1 text-muted-foreground rounded-md"
          >
            {["day", "week", "month", "year"].map((r) => (
              <ToggleGroupItem
                key={r}
                value={r}
                className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value="custom"
              className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
            >
              Custom
            </ToggleGroupItem>
          </ToggleGroup>
          {range === "custom" && (
            <div className="mt-2 flex items-center justify-center gap-2 animate-in fade-in">
              <DatePicker
                date={customStart}
                setDate={setCustomStart}
                placeholder="Start"
              />
              <DatePicker
                date={customEnd}
                setDate={setCustomEnd}
                placeholder="End"
              />
            </div>
          )}
        </div>

        <div className="space-y-[calc(var(--section-gap)/2)]">
          {/* Unconverted transactions warning */}
          {!dismissedWarning && fxSummary.unconvertedCount > 0 && (
            <UnconvertedWarningBanner
              unconvertedCount={fxSummary.unconvertedCount}
              unconvertedCurrencies={fxSummary.unconvertedCurrencies}
              onDismiss={() => setDismissedWarning(true)}
            />
          )}

          <DashboardStats
            income={homeSummary.income}
            expenses={homeSummary.expenses}
            balance={homeSummary.balance}
            currencyCode={baseCurrency}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--card-gap)]">
            <div className="bg-card p-[var(--card-padding)] rounded-lg shadow">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-4 border-b">
                  <TabsTrigger
                    value="trends"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors"
                  >
                    Trends
                  </TabsTrigger>
                  <TabsTrigger
                    value="net"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors"
                  >
                    Net Balance
                  </TabsTrigger>
                  <TabsTrigger
                    value="category"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors"
                  >
                    Category
                  </TabsTrigger>
                  <TabsTrigger
                    value="subcategory"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors"
                  >
                    Subcategory
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-2">
                  <h2 className="text-lg font-semibold">Spending Trends</h2>
                  <ChartErrorBoundary chartName="Spending Trends">
                    <TimelineChart data={timelineData} />
                  </ChartErrorBoundary>
                </TabsContent>

                <TabsContent value="net" className="space-y-2">
                  <h2 className="text-lg font-semibold">Net Growth Summary</h2>
                  <ChartErrorBoundary chartName="Net Balance">
                    <NetBalanceChart data={timelineData} />
                  </ChartErrorBoundary>
                </TabsContent>

                <TabsContent value="category" className="pt-2">
                  <ChartErrorBoundary chartName="Category Chart">
                    <CategoryChart data={expensesByCategory} />
                  </ChartErrorBoundary>
                </TabsContent>

                <TabsContent value="subcategory" className="pt-2">
                  <ChartErrorBoundary chartName="Subcategory Chart">
                    <SubcategoryChart data={expensesBySubcategory} />
                  </ChartErrorBoundary>
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-card p-[var(--card-padding)] rounded-lg shadow flex flex-col justify-between">
              <h2 className="text-lg font-semibold mb-2">
                Recent Transactions
              </h2>

              {filteredTransactions.length > 0 ? (
                <div className="space-y-1 flex-1">
                  {filteredTransactions.slice(0, 5).map((transaction, idx) => (
                    <div
                      key={transaction.id || idx}
                      onClick={() =>
                        navigate(`/edit-transaction/${transaction.id}`, {
                          state: { transaction },
                        })
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        navigate(`/edit-transaction/${transaction.id}`, {
                          state: { transaction },
                        })
                      }
                      aria-label="Edit transaction"
                      role="button"
                      tabIndex={0}
                      className="bg-card text-card-foreground dark:bg-black dark:text-white rounded-lg shadow-sm border px-4 py-3 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const entry =
                              CATEGORY_ICON_MAP[transaction.category] ||
                              CATEGORY_ICON_MAP["Other"];
                            const Icon = entry.icon;
                            return (
                              <div
                                className={`w-10 h-10 flex items-center justify-center rounded-full ${entry.background}`}
                              >
                                <Icon className={entry.color} size={20} />
                              </div>
                            );
                          })()}
                          {(() => {
                            const TypeIcon =
                              TYPE_ICON_MAP[transaction.type].icon;
                            return (
                              <TypeIcon
                                className={`w-4 h-4 ${TYPE_ICON_MAP[transaction.type].color}`}
                              />
                            );
                          })()}
                          <span className="font-medium line-clamp-1">
                            {formatDisplayTitle(transaction)}
                          </span>
                        </div>
                        {/* Display converted amount (amountInBase) with original as secondary */}
                        {(() => {
                          const displayAmount = transaction.effectiveAmount;
                          const txCurrency = (transaction.currency || baseCurrency).toUpperCase();
                          const showOriginal = txCurrency !== baseCurrency.toUpperCase() && transaction.amountInBase != null;
                          const isNegative = transaction.type === 'expense' || transaction.amount < 0;
                          
                          return (
                            <div className="text-right">
                              <div
                                className={
                                  isNegative
                                    ? "text-red-600 font-semibold"
                                    : "text-green-600 font-semibold"
                                }
                              >
                                {isNegative ? "−" : "+"}
                                {formatCurrency(Math.abs(displayAmount), baseCurrency)}
                              </div>
                              {showOriginal && (
                                <div className="text-xs text-muted-foreground">
                                  ({formatCurrency(Math.abs(transaction.amount), transaction.currency)})
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTxnDate(transaction.date)} •{" "}
                        {transaction.category}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No transactions found for this period.
                </p>
              )}

              <div className="flex justify-start mt-3 pb-[calc(var(--bottom-nav-height,0px)+var(--safe-area-bottom)+0.25rem)]">
                <button
                  onClick={() => navigate("/transactions")}
                  aria-label="View full transaction history"
                  className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ResponsiveFAB onClick={handleAddTransaction} />
    </Layout>
  );
};

export default Home;
