import { describe, expect, it, beforeEach } from 'vitest';
import { format } from 'date-fns';
import {
  getMonthsInQuarter,
  getMonthDates,
  getQuarterDates,
  getYearDates,
  getWeeksInMonth,
  getWeeksInYear,
  getPeriodDates,
  getCurrentPeriodInfo,
  getPeriodLabel,
  getPeriodTypeLabel,
  navigatePeriod,
  isWithinPeriod,
  getTotalDaysInPeriod,
} from '../budget-period-utils';

const setWeekStart = (weekStartsOn: number) => {
  localStorage.setItem('xpensia_settings', JSON.stringify({ weekStartsOn }));
};

describe('budget-period-utils', () => {
  beforeEach(() => {
    localStorage.clear();
    setWeekStart(1);
  });

  it('gets month and quarter date ranges', () => {
    const month = getMonthDates(2024, 2);
    expect(format(month.start, 'yyyy-MM-dd')).toBe('2024-02-01');
    expect(format(month.end, 'yyyy-MM-dd')).toBe('2024-02-29');

    const quarter = getQuarterDates(2024, 2);
    expect(format(quarter.start, 'yyyy-MM-dd')).toBe('2024-04-01');
    expect(format(quarter.end, 'yyyy-MM-dd')).toBe('2024-06-30');

    const year = getYearDates(2024);
    expect(format(year.start, 'yyyy-MM-dd')).toBe('2024-01-01');
    expect(format(year.end, 'yyyy-MM-dd')).toBe('2024-12-31');
  });

  it('returns months for a quarter and weeks for a month', () => {
    expect(getMonthsInQuarter(3)).toEqual([7, 8, 9]);
    expect(getWeeksInMonth(2024, 3)).toBeGreaterThanOrEqual(4);
  });

  it('derives period dates based on period type', () => {
    const monthly = getPeriodDates('monthly', 2024, 5);
    expect(format(monthly.start, 'yyyy-MM-dd')).toBe('2024-05-01');

    const yearly = getPeriodDates('yearly', 2023);
    expect(format(yearly.end, 'yyyy-MM-dd')).toBe('2023-12-31');
  });

  it('provides current period info with label', () => {
    const info = getCurrentPeriodInfo('monthly');
    expect(info.label).toContain(String(info.year));
    expect(info.periodIndex).toBeGreaterThanOrEqual(1);
  });

  it('returns labels for period and type', () => {
    expect(getPeriodLabel('weekly')).toBe('This Week');
    expect(getPeriodTypeLabel('quarterly')).toBe('Quarterly');
  });

  it('navigates between months across year boundaries', () => {
    expect(navigatePeriod('monthly', 2024, 12, 'next')).toEqual({ year: 2025, periodIndex: 1 });
    expect(navigatePeriod('monthly', 2024, 1, 'prev')).toEqual({ year: 2023, periodIndex: 12 });
  });

  it('checks dates within periods and total days', () => {
    const start = '2024-05-01';
    const end = '2024-05-31';
    expect(isWithinPeriod('2024-05-15', start, end)).toBe(true);
    expect(getTotalDaysInPeriod(start, end)).toBe(31);
  });

  it('computes weeks in year based on settings', () => {
    setWeekStart(0);
    expect(getWeeksInYear(2023)).toBeGreaterThanOrEqual(52);
  });
});
