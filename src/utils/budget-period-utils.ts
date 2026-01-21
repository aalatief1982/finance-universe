import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  isWithinInterval,
  differenceInDays,
  parseISO,
  format,
  getWeek,
  getQuarter,
  setWeek,
  getYear,
  setYear,
  getDaysInMonth,
  eachWeekOfInterval,
} from 'date-fns';
import { BudgetPeriod } from '@/models/budget';

export interface PeriodDates {
  start: Date;
  end: Date;
}

// Get user's preferred week start (0 = Sunday, 1 = Monday)
// This will eventually come from settings
export function getWeekStartSetting(): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  try {
    const settings = localStorage.getItem('xpensia_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.weekStartsOn ?? 1; // Default to Monday
    }
  } catch {
    // ignore
  }
  return 1; // Monday default
}

/**
 * Get ISO week number for a date (1-53)
 */
export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: getWeekStartSetting() });
}

/**
 * Get the year that a week belongs to (handles year boundaries)
 */
export function getWeekYear(date: Date): number {
  const weekStart = startOfWeek(date, { weekStartsOn: getWeekStartSetting() });
  return getYear(weekStart);
}

/**
 * Get start and end dates for a specific week of a year
 */
export function getWeekDates(year: number, weekNumber: number): PeriodDates {
  const weekStartsOn = getWeekStartSetting();
  
  // Get the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Find the first week's start
  const firstWeekStart = startOfWeek(firstDayOfYear, { weekStartsOn });
  
  // Calculate the target week start (weekNumber - 1 because week 1 is at index 0)
  const targetWeekStart = addWeeks(firstWeekStart, weekNumber - 1);
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn });
  
  return {
    start: targetWeekStart,
    end: targetWeekEnd,
  };
}

/**
 * Get start and end dates for a specific month of a year
 */
export function getMonthDates(year: number, month: number): PeriodDates {
  const date = new Date(year, month - 1, 1); // month is 1-indexed
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Get start and end dates for a specific quarter of a year
 */
export function getQuarterDates(year: number, quarter: number): PeriodDates {
  // Quarter is 1-4
  const monthStart = (quarter - 1) * 3; // Q1 = month 0-2, Q2 = month 3-5, etc.
  const date = new Date(year, monthStart, 1);
  return {
    start: startOfQuarter(date),
    end: endOfQuarter(date),
  };
}

/**
 * Get start and end dates for a specific year
 */
export function getYearDates(year: number): PeriodDates {
  const date = new Date(year, 0, 1);
  return {
    start: startOfYear(date),
    end: endOfYear(date),
  };
}

/**
 * Get number of weeks in a month
 */
export function getWeeksInMonth(year: number, month: number): number {
  const { start, end } = getMonthDates(year, month);
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: getWeekStartSetting() });
  return weeks.length;
}

/**
 * Get months in a quarter
 */
export function getMonthsInQuarter(quarter: number): number[] {
  const startMonth = (quarter - 1) * 3 + 1;
  return [startMonth, startMonth + 1, startMonth + 2];
}

/**
 * Get total weeks in a year
 * Uses eachWeekOfInterval to correctly count weeks regardless of week numbering edge cases
 */
export function getWeeksInYear(year: number): number {
  const { start, end } = getYearDates(year);
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: getWeekStartSetting() });
  return weeks.length;
}

/**
 * Format a period label for display
 */
export function formatPeriodLabel(
  period: BudgetPeriod, 
  year: number, 
  periodIndex?: number
): string {
  switch (period) {
    case 'weekly':
      return `Week ${periodIndex}, ${year}`;
    
    case 'monthly':
      const monthDate = new Date(year, (periodIndex || 1) - 1, 1);
      return format(monthDate, 'MMM yyyy');
    
    case 'quarterly':
      return `Q${periodIndex} ${year}`;
    
    case 'yearly':
      return `${year}`;
    
    default:
      return `${year}`;
  }
}

/**
 * Get short period label (for tabs/chips)
 */
export function getShortPeriodLabel(
  period: BudgetPeriod, 
  periodIndex?: number
): string {
  switch (period) {
    case 'weekly':
      return `W${periodIndex}`;
    case 'monthly':
      const monthDate = new Date(2024, (periodIndex || 1) - 1, 1);
      return format(monthDate, 'MMM');
    case 'quarterly':
      return `Q${periodIndex}`;
    case 'yearly':
      return 'Year';
    default:
      return '';
  }
}

/**
 * Get period dates for a budget based on its period type, year, and index
 */
export function getPeriodDates(
  period: BudgetPeriod,
  year: number,
  periodIndex?: number
): PeriodDates {
  switch (period) {
    case 'weekly':
      return getWeekDates(year, periodIndex || 1);
    case 'monthly':
      return getMonthDates(year, periodIndex || 1);
    case 'quarterly':
      return getQuarterDates(year, periodIndex || 1);
    case 'yearly':
      return getYearDates(year);
    default:
      return getMonthDates(year, periodIndex || 1);
  }
}

/**
 * Get the current period dates based on budget period type.
 * Uses calendar-based periods (no custom dates).
 */
export function getCurrentPeriodDates(period: BudgetPeriod): PeriodDates {
  const now = new Date();
  const weekStartsOn = getWeekStartSetting();
  
  switch (period) {
    case 'weekly':
      return {
        start: startOfWeek(now, { weekStartsOn }),
        end: endOfWeek(now, { weekStartsOn }),
      };
    
    case 'monthly':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    
    case 'quarterly':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };
    
    case 'yearly':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
}

/**
 * Get the previous period dates for rollover calculations.
 */
export function getPreviousPeriodDates(period: BudgetPeriod): PeriodDates {
  const current = getCurrentPeriodDates(period);
  
  switch (period) {
    case 'weekly':
      return {
        start: subWeeks(current.start, 1),
        end: subWeeks(current.end, 1),
      };
    
    case 'monthly':
      return {
        start: subMonths(current.start, 1),
        end: subMonths(current.end, 1),
      };
    
    case 'quarterly':
      return {
        start: subQuarters(current.start, 1),
        end: subQuarters(current.end, 1),
      };
    
    case 'yearly':
      return {
        start: subYears(current.start, 1),
        end: subYears(current.end, 1),
      };
    
    default:
      return {
        start: subMonths(current.start, 1),
        end: subMonths(current.end, 1),
      };
  }
}

/**
 * Get the next period dates for projections.
 */
export function getNextPeriodDates(period: BudgetPeriod): PeriodDates {
  const current = getCurrentPeriodDates(period);
  
  switch (period) {
    case 'weekly':
      return {
        start: addWeeks(current.start, 1),
        end: addWeeks(current.end, 1),
      };
    
    case 'monthly':
      return {
        start: addMonths(current.start, 1),
        end: addMonths(current.end, 1),
      };
    
    case 'quarterly':
      return {
        start: addQuarters(current.start, 1),
        end: addQuarters(current.end, 1),
      };
    
    case 'yearly':
      return {
        start: addYears(current.start, 1),
        end: addYears(current.end, 1),
      };
    
    default:
      return {
        start: addMonths(current.start, 1),
        end: addMonths(current.end, 1),
      };
  }
}

/**
 * Get current period info (year, index, dates)
 */
export function getCurrentPeriodInfo(period: BudgetPeriod): {
  year: number;
  periodIndex: number;
  dates: PeriodDates;
  label: string;
} {
  const now = new Date();
  const dates = getCurrentPeriodDates(period);
  
  let periodIndex: number;
  
  switch (period) {
    case 'weekly':
      periodIndex = getWeekNumber(now);
      break;
    case 'monthly':
      periodIndex = now.getMonth() + 1;
      break;
    case 'quarterly':
      periodIndex = getQuarter(now);
      break;
    case 'yearly':
      periodIndex = 1; // Not used for yearly
      break;
    default:
      periodIndex = now.getMonth() + 1;
  }
  
  const year = period === 'weekly' ? getWeekYear(now) : now.getFullYear();
  
  return {
    year,
    periodIndex,
    dates,
    label: formatPeriodLabel(period, year, periodIndex),
  };
}

/**
 * Check if a date falls within a period.
 */
export function isWithinPeriod(
  date: Date | string, 
  periodStart: Date | string, 
  periodEnd: Date | string
): boolean {
  const checkDate = typeof date === 'string' ? parseISO(date) : date;
  const start = typeof periodStart === 'string' ? parseISO(periodStart) : periodStart;
  const end = typeof periodEnd === 'string' ? parseISO(periodEnd) : periodEnd;
  
  return isWithinInterval(checkDate, { start, end });
}

/**
 * Calculate days remaining in the current period.
 */
export function getDaysRemainingInPeriod(periodEnd: Date | string): number {
  const end = typeof periodEnd === 'string' ? parseISO(periodEnd) : periodEnd;
  const now = new Date();
  
  const days = differenceInDays(end, now);
  return Math.max(0, days);
}

/**
 * Calculate total days in a period.
 */
export function getTotalDaysInPeriod(periodStart: Date | string, periodEnd: Date | string): number {
  const start = typeof periodStart === 'string' ? parseISO(periodStart) : periodStart;
  const end = typeof periodEnd === 'string' ? parseISO(periodEnd) : periodEnd;
  
  return differenceInDays(end, start) + 1; // +1 to include both start and end days
}

/**
 * Format a period for display.
 */
export function formatPeriodRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  
  if (sameMonth) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  
  if (sameYear) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Get period label for display (legacy - current period).
 */
export function getPeriodLabel(period: BudgetPeriod): string {
  const labels: Record<BudgetPeriod, string> = {
    weekly: 'This Week',
    monthly: 'This Month',
    quarterly: 'This Quarter',
    yearly: 'This Year',
  };
  
  return labels[period] || 'This Month';
}

/**
 * Get period type label
 */
export function getPeriodTypeLabel(period: BudgetPeriod): string {
  const labels: Record<BudgetPeriod, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  
  return labels[period] || 'Monthly';
}

/**
 * Navigate to previous/next period
 */
export function navigatePeriod(
  period: BudgetPeriod,
  year: number,
  periodIndex: number,
  direction: 'prev' | 'next'
): { year: number; periodIndex: number } {
  const delta = direction === 'next' ? 1 : -1;
  
  switch (period) {
    case 'weekly': {
      const weeksInYear = getWeeksInYear(year);
      let newIndex = periodIndex + delta;
      let newYear = year;
      
      if (newIndex < 1) {
        newYear = year - 1;
        newIndex = getWeeksInYear(newYear);
      } else if (newIndex > weeksInYear) {
        newYear = year + 1;
        newIndex = 1;
      }
      
      return { year: newYear, periodIndex: newIndex };
    }
    
    case 'monthly': {
      let newIndex = periodIndex + delta;
      let newYear = year;
      
      if (newIndex < 1) {
        newYear = year - 1;
        newIndex = 12;
      } else if (newIndex > 12) {
        newYear = year + 1;
        newIndex = 1;
      }
      
      return { year: newYear, periodIndex: newIndex };
    }
    
    case 'quarterly': {
      let newIndex = periodIndex + delta;
      let newYear = year;
      
      if (newIndex < 1) {
        newYear = year - 1;
        newIndex = 4;
      } else if (newIndex > 4) {
        newYear = year + 1;
        newIndex = 1;
      }
      
      return { year: newYear, periodIndex: newIndex };
    }
    
    case 'yearly': {
      return { year: year + delta, periodIndex: 1 };
    }
    
    default:
      return { year, periodIndex };
  }
}
