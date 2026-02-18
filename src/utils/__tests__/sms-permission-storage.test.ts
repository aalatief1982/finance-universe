import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

vi.mock('@/utils/safe-storage', () => ({
  safeStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  },
}));

vi.mock('@/lib/env', () => ({
  getSmsLookbackMonths: vi.fn(() => 1),
}));

import { getSmsLookbackMonths } from '@/lib/env';
import { getAutoImportStartDate } from '@/utils/sms-permission-storage';

const setStoredValue = (key: string, value: string) => storage.set(key, value);

describe('getAutoImportStartDate', () => {
  beforeEach(() => {
    storage.clear();
    vi.mocked(getSmsLookbackMonths).mockReturnValue(1);
  });

  it('uses permission date minus env lookback months when no last import is present', () => {
    setStoredValue('xpensia_sms_permission_grant_date', '2026-02-15T00:00:00.000Z');

    const startDate = getAutoImportStartDate();

    expect(startDate.toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });

  it('uses configured lookback months from env helper', () => {
    vi.mocked(getSmsLookbackMonths).mockReturnValue(2);
    setStoredValue('xpensia_sms_permission_grant_date', '2026-02-15T00:00:00.000Z');

    const startDate = getAutoImportStartDate();

    expect(startDate.toISOString()).toBe('2025-12-15T00:00:00.000Z');
  });

  it('prefers last import date when it is later than permission lookback date', () => {
    setStoredValue('xpensia_sms_permission_grant_date', '2026-02-15T00:00:00.000Z');
    setStoredValue('xpensia_last_auto_import_date', '2026-02-01T00:00:00.000Z');

    const startDate = getAutoImportStartDate();

    expect(startDate.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('falls back to 30 days ago when date inputs are invalid', () => {
    setStoredValue('xpensia_sms_permission_grant_date', 'not-a-date');

    const now = new Date();
    const startDate = getAutoImportStartDate();
    const diffMs = now.getTime() - startDate.getTime();

    expect(diffMs).toBeGreaterThanOrEqual(29 * 24 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual(31 * 24 * 60 * 60 * 1000);
  });
});
