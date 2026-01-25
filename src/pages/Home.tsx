import React from "react";
import Layout from "@/components/Layout";
import DashboardStats from "@/components/DashboardStats";
import TimelineChart from "@/components/charts/TimelineChart";
import NetBalanceChart from "@/components/charts/NetBalanceChart";
import CategoryChart from "@/components/charts/CategoryChart";
import SubcategoryChart from "@/components/charts/SubcategoryChart";
import ChartErrorBoundary from "@/components/charts/ChartErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/context/TransactionContext";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { TYPE_ICON_MAP } from "@/constants/typeIconMap";
import { CATEGORY_ICON_MAP } from "@/constants/categoryIconMap";
import { format } from "date-fns";

import ResponsiveFAB from "@/components/dashboard/ResponsiveFAB";
import AvatarGreeting from "@/components/dashboard/AvatarGreeting";
import PageHeader from "@/components/layout/PageHeader";
import { v4 as uuidv4 } from "uuid";
import { Transaction } from "@/types/transaction";
import { useUser } from "@/context/UserContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AnalyticsService } from "@/services/AnalyticsService";
import { DatePicker } from "@/components/ui/date-picker";

const Home = () => {
  const { transactions, addTransaction } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();

  type Range = "" | "day" | "week" | "month" | "year" | "custom";
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

  const handleAddTransaction = () => {
    navigate("/edit-transaction");
  };

  const filteredTransactions = React.useMemo(() => {
    if (!range) {
      return transactions;
    }

    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (range) {
      case "day":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        if (customStart) start = new Date(customStart);
        if (customEnd) end = new Date(customEnd);
        break;
    }

    const toDate = range === "custom" ? end : now;

    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= toDate;
    });
  }, [transactions, range, customStart, customEnd]);

  // Calculate summary (EXCLUDES transfers from income/expense totals)
  const summary = React.useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        // Defensive: skip invalid transactions
        if (!transaction || typeof transaction.amount !== 'number') {
          return acc;
        }
        
        if (transaction.type === 'income') {
          acc.income += Math.abs(transaction.amount);
        } else if (transaction.type === 'expense') {
          acc.expenses += Math.abs(transaction.amount);
        }
        // Transfers don't affect the balance calculation for financial summary
        if (transaction.type !== 'transfer') {
          acc.balance += transaction.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 },
    );
  }, [filteredTransactions]);

  // Category data (EXCLUDES transfers)
  const categoryData = React.useMemo(() => {
    return filteredTransactions
      .filter((t) => t && t.type === 'expense')
      .reduce(
        (acc, transaction) => {
          const category = transaction.category || 'Uncategorized';
          const amount = transaction.amount || 0;
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += Math.abs(amount);
          return acc;
        },
        {} as Record<string, number>,
      );
  }, [filteredTransactions]);

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

  const expensesBySubcategory = React.useMemo(() => {
    try {
      return AnalyticsService.getSubcategoryData(filteredTransactions);
    } catch {
      console.warn('[Home] Failed to get subcategory data');
      return [];
    }
  }, [filteredTransactions]);

  const expensesByCategory = React.useMemo(() => {
    try {
      return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
    } catch {
      return [];
    }
  }, [categoryData]);

  // Timeline data (EXCLUDES transfers)
  const timelineData = React.useMemo(() => {
    try {
      const grouped = new Map<number, { income: number; expense: number }>();
      filteredTransactions.forEach((tx) => {
        // Skip transfers and invalid transactions
        if (!tx || tx.type === 'transfer') return;
        
        const d = new Date(tx.date);
        if (isNaN(d.getTime())) return; // Skip invalid dates
        
        const bucket =
          range === "year"
            ? new Date(d.getFullYear(), d.getMonth(), 1)
            : new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const key = bucket.getTime();
        const existing = grouped.get(key) || { income: 0, expense: 0 };
        if (tx.type === 'income') {
          existing.income += Math.abs(tx.amount || 0);
        } else if (tx.type === 'expense') {
          existing.expense += Math.abs(tx.amount || 0);
        }
        grouped.set(key, existing);
      });
      return Array.from(grouped.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([ts, val]) => ({
          date: new Date(ts).toISOString(),
          income: val.income,
          expense: val.expense,
          balance: val.income - val.expense,
        }));
    } catch (err) {
      console.warn('[Home] Failed to compute timeline data:', err);
      return [];
    }
  }, [filteredTransactions, range]);

  return (
    <Layout withPadding={false} fullWidth>
      <div className="container px-1">
        <PageHeader title={<AvatarGreeting user={user} />} />

        <div className="my-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(val) => setRange(val as Range)}
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
          <DashboardStats
            income={summary.income}
            expenses={summary.expenses}
            balance={summary.balance}
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
                      aria-label="Edit transaction"
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
                        <div
                          className={
                            transaction.amount < 0
                              ? "text-red-600 font-semibold"
                              : "text-green-600 font-semibold"
                          }
                        >
                          {transaction.amount < 0 ? "−" : "+"}
                          {Math.abs(transaction.amount).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
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

              <div className="flex justify-start mt-3 mb-16">
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
