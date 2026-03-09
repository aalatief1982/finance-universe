import React, { useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from 'recharts';
import { AnalyticsService } from '@/services/AnalyticsService';
import { transactionService } from '@/services/TransactionService';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#6c757d'];

type Range = '' | 'day' | 'week' | 'month' | 'year' | 'custom';

interface DriverItem {
  name: string;
  delta: number;
  previous: number;
  current: number;
}

interface ActionItem {
  key: string;
  title: string;
  description: string;
  ctaLabel: 'Review' | 'Fix' | 'Set budget' | 'Confirm recurring';
  onCta: () => void;
  priority: number;
}

const AnalyticsDeltaSection: React.FC<{
  spendingDelta: number;
  spendingDeltaPercent: number;
  balanceDelta: number;
  balanceDeltaPercent: number;
  budgetRiskCount: number;
  budgetConfigured: boolean;
  onScrollToDrivers: () => void;
  onScrollToActions: () => void;
}> = ({
  spendingDelta,
  spendingDeltaPercent,
  balanceDelta,
  balanceDeltaPercent,
  budgetRiskCount,
  budgetConfigured,
  onScrollToDrivers,
  onScrollToActions,
}) => {
  const DeltaIcon = spendingDelta >= 0 ? ArrowUpRight : ArrowDownRight;
  const BalanceIcon = balanceDelta >= 0 ? ArrowUpRight : ArrowDownRight;

  const { t } = useLanguage();
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">{t('analytics.executiveDelta')}</h2>
      <div className="grid grid-cols-1 gap-2">
        <button type="button" onClick={onScrollToDrivers} className="text-left">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{t('analytics.spendingVsPrevious')}</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{spendingDeltaPercent.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(spendingDelta)}</p>
                </div>
                <DeltaIcon className={spendingDelta >= 0 ? 'text-destructive' : 'text-emerald-600'} size={18} />
              </div>
            </CardContent>
          </Card>
        </button>

        <button type="button" onClick={onScrollToDrivers} className="text-left">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{t('analytics.netBalanceVsPrevious')}</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{balanceDeltaPercent.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(balanceDelta)}</p>
                </div>
                <BalanceIcon className={balanceDelta >= 0 ? 'text-emerald-600' : 'text-destructive'} size={18} />
              </div>
            </CardContent>
          </Card>
        </button>

        <button type="button" onClick={onScrollToActions} className="text-left">
          <Card>
            <CardContent className="py-4">
              {budgetConfigured ? (
                <>
                  <p className="text-xs text-muted-foreground">{t('analytics.budgetRiskSummary')}</p>
                  <p className="mt-2 text-lg font-semibold">
                    {budgetRiskCount} {budgetRiskCount === 1 ? t('analytics.categoryIs') : t('analytics.categoriesAre')} {t('analytics.categoriesAtRisk')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{t('analytics.budgetTracking')}</p>
                  <p className="mt-2 text-sm font-medium">{t('analytics.noBudgetsSet')}</p>
                </>
              )}
            </CardContent>
          </Card>
        </button>
      </div>
    </section>
  );
};

const DriverRows: React.FC<{ title: string; rows: DriverItem[]; onClickRow: (name: string) => void }> = ({ title, rows, onClickRow }) => {
  const { t } = useLanguage();
  return (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map(row => {
            const isIncrease = row.delta >= 0;
            return (
              <button
                key={row.name}
                type="button"
                className="w-full rounded-md border p-2 text-left hover:bg-muted/50"
                onClick={() => onClickRow(row.name)}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className={isIncrease ? 'text-destructive' : 'text-emerald-600'}>
                    {isIncrease ? '+' : '-'}{formatCurrency(Math.abs(row.delta))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(row.previous)} → {formatCurrency(row.current)}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('analytics.notEnoughHistory')}</p>
      )}
    </CardContent>
  </Card>
  );
};

const AnalyticsDriversSection: React.FC<{
  categoryDrivers: DriverItem[];
  merchantDrivers: DriverItem[];
  onCategoryClick: (categoryName: string) => void;
  onMerchantClick: (merchantName: string) => void;
}> = ({ categoryDrivers, merchantDrivers, onCategoryClick, onMerchantClick }) => {
  const { t } = useLanguage();
  return (
  <section className="space-y-2">
    <h2 className="text-sm font-medium text-muted-foreground">{t('analytics.driversOfChange')}</h2>
    <div className="space-y-3">
      <DriverRows title={t('analytics.categoryDrivers')} rows={categoryDrivers} onClickRow={onCategoryClick} />
      <DriverRows title={t('analytics.merchantDrivers')} rows={merchantDrivers} onClickRow={onMerchantClick} />
    </div>
  </section>
  );
};

const AnalyticsActionsSection: React.FC<{ actions: ActionItem[] }> = ({ actions }) => {
  const { t } = useLanguage();
  if (!actions.length) return null;
  const recommendedKey = [...actions].sort((a, b) => b.priority - a.priority)[0]?.key;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">{t('analytics.actionsAndRisks')}</h2>
      <div className="space-y-3">
        {actions.map(action => {
          const recommended = action.key === recommendedKey;
          return (
            <Card key={action.key} className={recommended ? 'border-primary/40 bg-primary/5' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  {recommended && <Badge variant="secondary">{t('analytics.recommended')}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                <Button size="sm" onClick={action.onCta}>{action.ctaLabel}</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

const AnalyticsTrendsSection: React.FC<{ topCategories: { name: string; value: number }[]; monthlyBalance: { date: string; balance: number }[] }> = ({ topCategories, monthlyBalance }) => {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  return (
    <section className="space-y-2">
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between">
                <CardTitle>{t('analytics.trends')}</CardTitle>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {monthlyBalance.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{t('analytics.spendingTrendLine')}</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyBalance} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('default', { month: 'short' })} tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => formatCurrency(v).replace(/[^0-9.]/g, '')} width={40} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => formatCurrency(Number(v))} labelFormatter={d => new Date(d).toLocaleDateString('default', { month: 'short', year: '2-digit' })} />
                        <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {topCategories.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{t('analytics.categoryDistribution')}</p>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCategories} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => formatCurrency(v).replace(/[^0-9.]/g, '')} width={40} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => formatCurrency(Number(v))} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {topCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </section>
  );
};

const getPeriodWindow = (range: Range, customStart: Date | null, customEnd: Date | null) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (range) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) end = new Date(customEnd);
      break;
    default:
      break;
  }

  const toDate = range === 'custom' ? end : now;
  return { start, end: toDate };
};

const Analytics: React.FC = () => {
  const { transactions } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  const baseCurrency = user?.preferences?.currency || 'SAR';

  useEffect(() => {
    logAnalyticsEvent('view_analytics', { screen: 'view_analytics', timestamp: Date.now() });
  }, []);

  const defaultEnd = React.useMemo(() => new Date(), []);
  const defaultStart = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);

  const [range, setRange] = React.useState<Range>('custom');
  const [customStart, setCustomStart] = React.useState<Date | null>(defaultStart);
  const [customEnd, setCustomEnd] = React.useState<Date | null>(defaultEnd);

  const driversRef = React.useRef<HTMLElement | null>(null);
  const actionsRef = React.useRef<HTMLElement | null>(null);

  const { filteredTransactions, previousTransactions } = React.useMemo(() => {
    const { start, end } = getPeriodWindow(range, customStart, customEnd);
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);

    const current = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const previous = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= prevStart && d <= prevEnd;
    });

    return { filteredTransactions: current, previousTransactions: previous };
  }, [transactions, range, customStart, customEnd]);

  const currentTotals = React.useMemo(
    () => AnalyticsService.getFxAwareTotals(filteredTransactions, baseCurrency),
    [filteredTransactions, baseCurrency],
  );
  const previousTotals = React.useMemo(
    () => AnalyticsService.getFxAwareTotals(previousTransactions, baseCurrency),
    [previousTransactions, baseCurrency],
  );

  const budgetData = React.useMemo(() => {
    const categories = transactionService.getCategories().filter(c => c.metadata?.budget);
    return categories.map(cat => {
      const spent = filteredTransactions
        .filter(t => t.category === cat.name && t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amountInBase ?? t.amount), 0);
      const budget = cat.metadata?.budget || 0;
      return { name: cat.name, budget, spent, percentUsed: budget ? (spent / budget) * 100 : 0 };
    });
  }, [filteredTransactions]);

  const topCategories = React.useMemo(
    () => AnalyticsService.getFxAwareCategoryData(filteredTransactions, baseCurrency).slice(0, 5),
    [filteredTransactions, baseCurrency],
  );

  const monthlyBalance = React.useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};
    filteredTransactions.forEach(tx => {
      if (tx.type === 'transfer') return;
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      const amount = Math.abs(tx.amountInBase ?? tx.amount);
      if (tx.type === 'income') grouped[key].income += amount;
      if (tx.type === 'expense') grouped[key].expense += amount;
    });

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([key, val]) => {
        const [year, month] = key.split('-').map(Number);
        return { date: new Date(year, month, 1).toISOString(), balance: val.income - val.expense };
      });
  }, [filteredTransactions]);

  const getDrivers = React.useCallback((groupBy: 'category' | 'vendor') => {
    const group = (list: typeof filteredTransactions) => {
      const grouped = new Map<string, number>();
      list.forEach(tx => {
        if (tx.type !== 'expense') return;
        const key = groupBy === 'category' ? tx.category || 'Uncategorized' : tx.vendor?.trim() || 'Unknown merchant';
        grouped.set(key, (grouped.get(key) ?? 0) + Math.abs(tx.amountInBase ?? tx.amount));
      });
      return grouped;
    };

    const current = group(filteredTransactions);
    const previous = group(previousTransactions);

    const rows = new Set([...current.keys(), ...previous.keys()]);
    return [...rows]
      .map(name => {
        const currentValue = current.get(name) ?? 0;
        const previousValue = previous.get(name) ?? 0;
        return { name, current: currentValue, previous: previousValue, delta: currentValue - previousValue };
      })
      .filter(row => row.current > 0 || row.previous > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5);
  }, [filteredTransactions, previousTransactions]);

  const categoryDrivers = React.useMemo(() => getDrivers('category'), [getDrivers]);
  const merchantDrivers = React.useMemo(() => getDrivers('vendor'), [getDrivers]);

  const spendingDelta = currentTotals.expenses - previousTotals.expenses;
  const spendingDeltaPercent = previousTotals.expenses
    ? (spendingDelta / previousTotals.expenses) * 100
    : currentTotals.expenses
      ? 100
      : 0;

  const currentBalance = currentTotals.income - currentTotals.expenses;
  const previousBalance = previousTotals.income - previousTotals.expenses;
  const balanceDelta = currentBalance - previousBalance;
  const balanceDeltaPercent = previousBalance
    ? (balanceDelta / Math.abs(previousBalance)) * 100
    : currentBalance
      ? 100
      : 0;

  const budgetRiskCount = budgetData.filter(item => item.percentUsed >= 80).length;
  const uncategorizedCount = filteredTransactions.filter(t => !t.category || t.category === 'Uncategorized').length;
  const unconvertedCount = filteredTransactions.filter(
    t => t.currency !== baseCurrency && (t.amountInBase === null || t.amountInBase === undefined),
  ).length;

  const recurringVendorsCount = React.useMemo(() => {
    const vendorMap = new Map<string, number[]>();
    filteredTransactions.forEach(tx => {
      if (tx.type !== 'expense' || !tx.vendor) return;
      const key = tx.vendor.trim();
      if (!vendorMap.has(key)) vendorMap.set(key, []);
      vendorMap.get(key)?.push(new Date(tx.date).getTime());
    });

    return [...vendorMap.values()].filter(dates => {
      if (dates.length < 3) return false;
      const sorted = dates.sort((a, b) => a - b);
      const intervals = sorted.slice(1).map((d, i) => (d - sorted[i]) / (1000 * 60 * 60 * 24));
      const avg = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
      return avg >= 25 && avg <= 35;
    }).length;
  }, [filteredTransactions]);

  const actions = React.useMemo<ActionItem[]>(() => {
    const list: ActionItem[] = [];
    if (budgetData.length && budgetRiskCount > 0) {
      list.push({
        key: 'budget-risk',
        title: 'Budget risk detected',
        description: `${budgetRiskCount} categories are approaching or above 80% of budget usage.`,
        ctaLabel: 'Set budget',
        onCta: () => navigate('/budget'),
        priority: 100,
      });
    }
    if (unconvertedCount > 0) {
      list.push({
        key: 'missing-fx',
        title: 'Missing exchange rates',
        description: `${unconvertedCount} transactions are missing conversion rates and may affect totals.`,
        ctaLabel: 'Fix',
        onCta: () => navigate('/exchange-rates'),
        priority: 90,
      });
    }
    if (uncategorizedCount > 0) {
      list.push({
        key: 'uncategorized',
        title: 'Uncategorized transactions',
        description: `${uncategorizedCount} transactions still need categories for cleaner analytics.`,
        ctaLabel: 'Review',
        onCta: () => navigate('/transactions?filter=uncategorized'),
        priority: 80,
      });
    }
    if (recurringVendorsCount > 0) {
      list.push({
        key: 'recurring',
        title: 'Possible recurring transactions',
        description: `${recurringVendorsCount} merchants look recurring based on recent cadence.`,
        ctaLabel: 'Confirm recurring',
        onCta: () => navigate('/transactions?filter=recurring'),
        priority: 70,
      });
    }
    return list;
  }, [budgetData.length, budgetRiskCount, unconvertedCount, uncategorizedCount, recurringVendorsCount, navigate]);

  const hasHistory = previousTransactions.length > 0;

  return (
    <Layout withPadding={false} fullWidth>
      <div className="container px-1">
        <div className="sticky top-0 z-10 bg-background px-[var(--page-padding-x)] pt-0 pb-2 space-y-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={val => setRange(val as Range)}
            className="w-full bg-muted p-1 text-muted-foreground rounded-md"
          >
            {['day', 'week', 'month', 'year'].map(r => (
              <ToggleGroupItem
                key={r}
                value={r}
                className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
              >
                {t(`range.${r}`)}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value="custom"
              className="flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium"
            >
              {t('analytics.custom')}
            </ToggleGroupItem>
          </ToggleGroup>
          {range === 'custom' && (
            <div className="mt-2 flex items-center gap-2 animate-in fade-in">
              <DatePicker date={customStart} setDate={setCustomStart} placeholder={t('home.datePicker.start')} />
              <DatePicker date={customEnd} setDate={setCustomEnd} placeholder={t('home.datePicker.end')} />
            </div>
          )}
        </div>

        <div
          className="space-y-4 px-[var(--page-padding-x)] pt-2"
          style={{ paddingBottom: 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                {t('analytics.addTransactionsToUnlock')}
              </CardContent>
            </Card>
          ) : (
            <>
              <AnalyticsDeltaSection
                spendingDelta={spendingDelta}
                spendingDeltaPercent={spendingDeltaPercent}
                balanceDelta={balanceDelta}
                balanceDeltaPercent={balanceDeltaPercent}
                budgetRiskCount={budgetRiskCount}
                budgetConfigured={budgetData.length > 0}
                onScrollToDrivers={() => driversRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                onScrollToActions={() => actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              />

              {hasHistory && (categoryDrivers.length > 0 || merchantDrivers.length > 0) && (
                <div ref={driversRef as React.RefObject<HTMLDivElement>}>
                  <AnalyticsDriversSection
                    categoryDrivers={categoryDrivers}
                    merchantDrivers={merchantDrivers}
                    onCategoryClick={(name) => navigate(`/transactions?group=category&value=${encodeURIComponent(name)}`)}
                    onMerchantClick={(name) => navigate(`/transactions?group=merchant&value=${encodeURIComponent(name)}`)}
                  />
                </div>
              )}

              {!hasHistory && (
                <Card ref={driversRef as React.RefObject<HTMLDivElement>}>
                  <CardHeader><CardTitle>{t('analytics.driversOfChange')}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{t('analytics.notEnoughHistory')}</p>
                  </CardContent>
                </Card>
              )}

              <div ref={actionsRef as React.RefObject<HTMLDivElement>}>
                <AnalyticsActionsSection actions={actions} />
              </div>

              {(monthlyBalance.length > 0 || topCategories.length > 0) && (
                <AnalyticsTrendsSection topCategories={topCategories} monthlyBalance={monthlyBalance} />
              )}

              {budgetData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>{t('analytics.budgetUtilization')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {budgetData.map(b => (
                        <div key={b.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{b.name}</span>
                            <span>{formatCurrency(b.spent)} / {formatCurrency(b.budget)}</span>
                          </div>
                          <Progress value={Math.min(100, b.percentUsed)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
