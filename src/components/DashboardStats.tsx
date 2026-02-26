/**
 * @file DashboardStats.tsx
 * @description UI component for DashboardStats.
 *
 * @module components/DashboardStats
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { getCurrencyOrAppFallback } from '@/utils/default-currency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardStatsProps {
  income: number;
  expenses: number;
  balance: number;
  previousBalance?: number;
  currencyCode?: string;
}

const MIN_AMOUNT_FONT_SIZE = 14;
const MAX_AMOUNT_FONT_SIZE = 18;

const amountFormatterCache = new Map<string, string>();
const fontSizeCache = new Map<string, number>();

const formatNumericAmount = (amount: number, currencyCode?: string): string => {
  if (!Number.isFinite(amount)) {
    return '--';
  }

  const code = currencyCode || getCurrencyOrAppFallback();
  const cacheKey = `${code}|${amount}`;
  const cached = amountFormatterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(amount)
    .filter((part) => part.type !== 'currency' && part.type !== 'literal')
    .map((part) => part.value)
    .join('')
    .trim();

  amountFormatterCache.set(cacheKey, formatted);
  return formatted;
};

const AutoFitAmount = ({
  value,
  className,
}: {
  value: string;
  className: string;
}) => {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const textRef = React.useRef<HTMLParagraphElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const isFramePendingRef = React.useRef(false);
  const lastMeasuredWidthRef = React.useRef(0);
  const lastMeasuredHeightRef = React.useRef(0);
  const lastAppliedFontSizeRef = React.useRef(MAX_AMOUNT_FONT_SIZE);
  const [fontSize, setFontSize] = React.useState(MAX_AMOUNT_FONT_SIZE);

  React.useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const textElement = textRef.current;
    if (!wrapper || !textElement || value === '--') {
      return;
    }

    const EPSILON = 1;

    const applyFontSize = (nextSize: number) => {
      if (Math.abs(lastAppliedFontSizeRef.current - nextSize) < 0.01) {
        return;
      }
      lastAppliedFontSizeRef.current = nextSize;
      setFontSize(nextSize);
    };

    const runMeasurement = () => {
      isFramePendingRef.current = false;
      const computedStyles = window.getComputedStyle(textElement);
      const availableWidth = wrapper.clientWidth;
      if (!availableWidth) {
        return;
      }

      const cacheKey = `${value}|${availableWidth}|${computedStyles.fontFamily}|${computedStyles.fontWeight}`;
      const cached = fontSizeCache.get(cacheKey);
      if (cached) {
        applyFontSize(cached);
        return;
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      let nextSize = MAX_AMOUNT_FONT_SIZE;
      for (let size = MAX_AMOUNT_FONT_SIZE; size >= MIN_AMOUNT_FONT_SIZE; size -= 1) {
        context.font = `${computedStyles.fontWeight} ${size}px ${computedStyles.fontFamily}`;
        if (context.measureText(value).width <= availableWidth) {
          nextSize = size;
          break;
        }
        nextSize = MIN_AMOUNT_FONT_SIZE;
      }

      fontSizeCache.set(cacheKey, nextSize);
      applyFontSize(nextSize);
    };

    const scheduleMeasurement = () => {
      if (isFramePendingRef.current) {
        return;
      }
      isFramePendingRef.current = true;
      frameRef.current = requestAnimationFrame(runMeasurement);
    };

    if (typeof ResizeObserver === 'undefined') {
      applyFontSize(MAX_AMOUNT_FONT_SIZE);
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      if (import.meta.env.DEV) {
        console.debug('[DashboardStats][AutoFitAmount] observed size', { width, height, value });
      }

      const widthDelta = Math.abs(width - lastMeasuredWidthRef.current);
      const heightDelta = Math.abs(height - lastMeasuredHeightRef.current);
      if (widthDelta <= EPSILON && heightDelta <= EPSILON) {
        return;
      }

      lastMeasuredWidthRef.current = width;
      lastMeasuredHeightRef.current = height;
      scheduleMeasurement();
    });

    resizeObserver.observe(wrapper);
    scheduleMeasurement();

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      isFramePendingRef.current = false;
      resizeObserver.disconnect();
    };
  }, [value]);

  return (
    <div ref={wrapperRef} className="w-full min-w-0">
      <p
        ref={textRef}
        className={className}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
        title={value}
      >
        {value}
      </p>
    </div>
  );
};

const DashboardStats = ({
  income,
  expenses,
  balance,
  previousBalance,
  currencyCode,
}: DashboardStatsProps) => {
  const resolvedCurrency = currencyCode || getCurrencyOrAppFallback();

  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug('[CurrencySync][DashboardStats] currency passed to formatter:', resolvedCurrency);
  }, [resolvedCurrency]);
  const balanceChange = previousBalance !== undefined 
    ? ((balance - previousBalance) / Math.abs(previousBalance || 1)) * 100
    : 0;
  
  const isPositiveChange = balanceChange >= 0;

  const formatValue = (val: number) => formatNumericAmount(val, resolvedCurrency);
  const renderSubtitle = (val: number) =>
    Number.isFinite(val) ? null : (
      <p className="text-xs text-muted-foreground">No data yet</p>
    );
  
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="overflow-hidden border border-border" role="button">
                <CardContent className="p-[var(--card-padding)]">
                  <div className="flex justify-between items-start">
                    <p className="flex-1 text-center text-sm font-medium text-muted-foreground">Income [{resolvedCurrency}]</p>
                    <ArrowUpCircle className="text-success" size={20} />
                  </div>
                  <AutoFitAmount className="mt-1 text-left font-semibold text-success tabular-nums whitespace-nowrap" value={formatValue(income)} />
                  {renderSubtitle(income)}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Click to see transactions for this period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="overflow-hidden border border-border" role="button">
                <CardContent className="p-[var(--card-padding)]">
                  <div className="flex justify-between items-start">
                    <p className="flex-1 text-center text-sm font-medium text-muted-foreground">Expenses [{resolvedCurrency}]</p>
                    <ArrowDownCircle className="text-destructive" size={20} />
                  </div>
                  <AutoFitAmount className="mt-1 text-left font-semibold text-destructive tabular-nums whitespace-nowrap" value={formatValue(Math.abs(expenses))} />
                  {renderSubtitle(expenses)}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Click to see transactions for this period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="overflow-hidden border border-border" role="button">
                <CardContent className="p-[var(--card-padding)]">
                  <div className="flex justify-between items-start">
                    <p className="flex-1 text-center text-sm font-medium text-muted-foreground">Balance [{resolvedCurrency}]</p>
                    <div className={`${balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                      {balance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                  </div>
                  <AutoFitAmount className={`mt-1 text-left font-semibold tabular-nums whitespace-nowrap ${balance >= 0 ? 'text-primary' : 'text-destructive'}`} value={formatValue(balance)} />
                  {renderSubtitle(balance)}
                  {previousBalance !== undefined && (
                    <p className={`text-xs flex items-center mt-1 ${isPositiveChange ? 'text-success' : 'text-destructive'}`}>
                      {isPositiveChange ? (
                        <TrendingUp size={14} className="mr-1" />
                      ) : (
                        <TrendingDown size={14} className="mr-1" />
                      )}
                      {Math.abs(balanceChange).toFixed(1)}% from last month
                    </p>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Click to see transactions for this period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
};

export default DashboardStats;
