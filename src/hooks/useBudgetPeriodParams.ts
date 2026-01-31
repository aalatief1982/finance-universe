/**
 * @file useBudgetPeriodParams.ts
 * @description Hook for syncing budget period filters with URL params.
 *
 * @module hooks/useBudgetPeriodParams
 *
 * @responsibilities
 * 1. Read/write period, year, and index query params
 * 2. Provide navigation helpers for previous/next periods
 * 3. Generate human-readable period labels
 *
 * @dependencies
 * - budget-period-utils.ts: period calculations and labels
 * - react-router: search params
 *
 * @review-tags
 * - @risk: param parsing defaults when values are missing
 *
 * @review-checklist
 * - [ ] Period changes reset to current period
 * - [ ] "all" clears period param from URL
 * - [ ] Label formatting matches UI expectations
 */

import { useSearchParams } from 'react-router-dom';
import { BudgetPeriod } from '@/models/budget';
import { getCurrentPeriodInfo, formatPeriodLabel, navigatePeriod as navPeriod } from '@/utils/budget-period-utils';
import { useCallback, useMemo } from 'react';

export type PeriodFilter = 'all' | BudgetPeriod;

interface BudgetPeriodParams {
  period: PeriodFilter;
  year: number;
  periodIndex: number;
}

interface UseBudgetPeriodParamsReturn extends BudgetPeriodParams {
  setPeriod: (period: PeriodFilter) => void;
  setYear: (year: number) => void;
  setPeriodIndex: (index: number) => void;
  setAll: (params: Partial<BudgetPeriodParams>) => void;
  navigatePeriod: (direction: 'prev' | 'next') => void;
  periodLabel: string;
}

export function useBudgetPeriodParams(defaultPeriod: PeriodFilter = 'monthly'): UseBudgetPeriodParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get current period info for defaults
  const currentMonthly = useMemo(() => getCurrentPeriodInfo('monthly'), []);
  
  // Read from URL or use defaults
  const period = (searchParams.get('period') as PeriodFilter) || defaultPeriod;
  const year = parseInt(searchParams.get('year') || '') || currentMonthly.year;
  const periodIndex = parseInt(searchParams.get('index') || '') || currentMonthly.periodIndex;
  
  // Generate period label
  const periodLabel = useMemo(() => {
    if (period === 'all') return 'All Time';
    return formatPeriodLabel(period, year, periodIndex);
  }, [period, year, periodIndex]);
  
  const updateParams = useCallback((updates: Partial<BudgetPeriodParams>) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (updates.period !== undefined) {
      if (updates.period === 'all') {
        newParams.delete('period');
      } else {
        newParams.set('period', updates.period);
      }
      
      // When period changes, reset to current period
      if (updates.period !== 'all' && updates.period !== period) {
        const newInfo = getCurrentPeriodInfo(updates.period);
        newParams.set('year', String(newInfo.year));
        newParams.set('index', String(newInfo.periodIndex));
      }
    }
    
    if (updates.year !== undefined) {
      newParams.set('year', String(updates.year));
    }
    
    if (updates.periodIndex !== undefined) {
      newParams.set('index', String(updates.periodIndex));
    }
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, period]);
  
  const setPeriod = useCallback((newPeriod: PeriodFilter) => {
    updateParams({ period: newPeriod });
  }, [updateParams]);
  
  const setYear = useCallback((newYear: number) => {
    updateParams({ year: newYear });
  }, [updateParams]);
  
  const setPeriodIndex = useCallback((newIndex: number) => {
    updateParams({ periodIndex: newIndex });
  }, [updateParams]);
  
  const setAll = useCallback((params: Partial<BudgetPeriodParams>) => {
    updateParams(params);
  }, [updateParams]);
  
  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    if (period === 'all') return;
    
    const result = navPeriod(period, year, periodIndex, direction);
    updateParams({ year: result.year, periodIndex: result.periodIndex });
  }, [period, year, periodIndex, updateParams]);
  
  return {
    period,
    year,
    periodIndex,
    setPeriod,
    setYear,
    setPeriodIndex,
    setAll,
    navigatePeriod,
    periodLabel,
  };
}
