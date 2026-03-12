/**
 * @file formatters.ts
 * @description Formatting helpers for currency, dates, and grouping.
 *
 * @module lib/formatters
 *
 * @responsibilities
 * 1. Format currency with user settings
 * 2. Format dates for UI display
 * 3. Group records by month for analytics
 *
 * @dependencies
 * - format-utils.ts: currency formatting implementation
 * - storage-utils.ts: user settings
 *
 * @review-tags
 * - @risk: timezone effects on month grouping
 *
 * @review-checklist
 * - [ ] Currency fallback uses user settings or USD
 * - [ ] Date formatting uses locale expectations
 * - [ ] Grouping skips items without date
 */

import { formatCurrency as formatCurrencyUtil } from '@/utils/format-utils';
import { getUserSettings } from '@/utils/storage-utils';

export const formatCurrency = (amount: number, currency?: string): string => {
  const currencyCode = currency || getUserSettings().currency || 'USD';
  return formatCurrencyUtil(amount, currencyCode);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const ISO_DATE_PREFIX_REGEX = /^\d{4}-\d{2}-\d{2}(?:$|T)/;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseIsoDateParts = (dateString: string): { year: number; month: number; day: number } | null => {
  if (!ISO_DATE_PREFIX_REGEX.test(dateString)) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = dateString.slice(0, 10).split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(utcDate.getTime()) ||
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() + 1 !== month ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

export const formatIsoDateToDayMonthYear = (dateString: string): string | null => {
  const isoParts = parseIsoDateParts(dateString);
  if (!isoParts) {
    return null;
  }

  const { year, month, day } = isoParts;
  return `${String(day).padStart(2, '0')}-${SHORT_MONTHS[month - 1]}-${year}`;
};

export const formatDisplayDate = (dateString: string): string => {
  return formatIsoDateToDayMonthYear(dateString) || dateString;
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Get a date string in YYYY-MM-DD format
export const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Group array of transactions by month - updated to handle optional date
export const groupByMonth = <T extends { date?: string }>(items: T[]): Record<string, T[]> => {
  return items.reduce((acc: Record<string, T[]>, item) => {
    // Skip items without a date property
    if (!item.date) return acc;
    
    const date = new Date(item.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(item);
    return acc;
  }, {});
};
