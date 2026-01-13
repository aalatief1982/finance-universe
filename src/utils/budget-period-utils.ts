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
  format
} from 'date-fns';
import { BudgetPeriod } from '@/models/budget';

export interface PeriodDates {
  start: Date;
  end: Date;
}

/**
 * Get the current period dates based on budget period type and optional custom start date.
 * Handles edge cases like mid-month starts and DST boundaries.
 */
export function getCurrentPeriodDates(
  period: BudgetPeriod, 
  customStartDate?: string
): PeriodDates {
  const now = new Date();
  const startDate = customStartDate ? parseISO(customStartDate) : now;
  
  switch (period) {
    case 'weekly':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    
    case 'monthly':
      // If custom start date is mid-month, calculate accordingly
      if (customStartDate) {
        const dayOfMonth = startDate.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Determine if we're past the custom start day this month
        let periodStart: Date;
        let periodEnd: Date;
        
        if (now.getDate() >= dayOfMonth) {
          // We're in the current custom month
          periodStart = new Date(currentYear, currentMonth, dayOfMonth);
          periodEnd = new Date(currentYear, currentMonth + 1, dayOfMonth - 1);
        } else {
          // We're in the previous custom month period
          periodStart = new Date(currentYear, currentMonth - 1, dayOfMonth);
          periodEnd = new Date(currentYear, currentMonth, dayOfMonth - 1);
        }
        
        // Handle end of day
        periodEnd.setHours(23, 59, 59, 999);
        
        return { start: periodStart, end: periodEnd };
      }
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
    
    case 'custom':
      // For custom periods, use the provided start and calculate end
      if (customStartDate) {
        return {
          start: startDate,
          end: now, // Custom periods run from start to now
        };
      }
      // Fallback to monthly if no custom date provided
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
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
export function getPreviousPeriodDates(
  period: BudgetPeriod, 
  customStartDate?: string
): PeriodDates {
  const current = getCurrentPeriodDates(period, customStartDate);
  
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
export function getNextPeriodDates(
  period: BudgetPeriod,
  customStartDate?: string
): PeriodDates {
  const current = getCurrentPeriodDates(period, customStartDate);
  
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
 * Get period label for display.
 */
export function getPeriodLabel(period: BudgetPeriod): string {
  const labels: Record<BudgetPeriod, string> = {
    weekly: 'This Week',
    monthly: 'This Month',
    quarterly: 'This Quarter',
    yearly: 'This Year',
    custom: 'Custom Period',
  };
  
  return labels[period] || 'This Month';
}
