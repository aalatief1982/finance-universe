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
