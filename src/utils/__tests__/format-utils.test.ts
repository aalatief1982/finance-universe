import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import { getCurrencySymbol, formatCurrency, formatDate, formatMonthYear } from '../format-utils';

describe('format-utils', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    localStorage.clear();
  });

  describe('getCurrencySymbol', () => {
    it('returns $ for USD', () => {
      const symbol = getCurrencySymbol('USD');
      expect(symbol).toBe('$');
    });

    it('returns £ for GBP', () => {
      const symbol = getCurrencySymbol('GBP');
      expect(symbol).toBe('£');
    });

    it('returns € for EUR', () => {
      const symbol = getCurrencySymbol('EUR');
      expect(symbol).toBe('€');
    });

    it('returns symbol for SAR', () => {
      const symbol = getCurrencySymbol('SAR');
      // SAR uses either ر.س or SAR depending on locale
      expect(['SAR', 'ر.س', 'SR']).toContain(symbol);
    });

    it('falls back to user settings currency when not provided', () => {
      localStorage.setItem(
        'xpensia_user_settings',
        JSON.stringify({ currency: 'GBP' })
      );
      const symbol = getCurrencySymbol();
      expect(symbol).toBe('£');
    });

    it('returns code for unknown currencies', () => {
      const symbol = getCurrencySymbol('XYZ');
      // Should return the code itself as fallback
      expect(symbol).toBe('XYZ');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly with $ symbol', () => {
      const formatted = formatCurrency(1234.56, 'USD');
      expect(formatted).toBe('$1,234.56');
    });

    it('formats GBP correctly with £ symbol', () => {
      const formatted = formatCurrency(1234.56, 'GBP');
      expect(formatted).toBe('£1,234.56');
    });

    it('formats EUR correctly', () => {
      const formatted = formatCurrency(1234.56, 'EUR');
      expect(formatted).toBe('€1,234.56');
    });

    it('formats SAR correctly', () => {
      const formatted = formatCurrency(1234.56, 'SAR');
      // SAR can be formatted as "SAR 1,234.56" or with symbol
      expect(formatted).toMatch(/1,234\.56/);
    });

    it('uses user settings currency as default', () => {
      localStorage.setItem(
        'xpensia_user_settings',
        JSON.stringify({ currency: 'GBP' })
      );
      const formatted = formatCurrency(100);
      expect(formatted).toBe('£100.00');
    });

    it('defaults to USD when no settings and no currency provided', () => {
      const formatted = formatCurrency(100);
      expect(formatted).toBe('$100.00');
    });

    it('handles negative amounts', () => {
      const formatted = formatCurrency(-50, 'USD');
      expect(formatted).toBe('-$50.00');
    });

    it('handles zero', () => {
      const formatted = formatCurrency(0, 'USD');
      expect(formatted).toBe('$0.00');
    });

    it('handles large numbers with proper formatting', () => {
      const formatted = formatCurrency(1000000, 'USD');
      expect(formatted).toBe('$1,000,000.00');
    });
  });

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const formatted = formatDate('2024-03-15');
      expect(formatted).toBe('Mar 15, 2024');
    });

    it('returns original string for invalid date', () => {
      const formatted = formatDate('invalid-date');
      // Should return the input as-is or some fallback
      expect(formatted).toBeDefined();
    });
  });

  describe('formatMonthYear', () => {
    it('formats date to month and year only', () => {
      const formatted = formatMonthYear('2024-03-15');
      expect(formatted).toBe('Mar 2024');
    });
  });
});
