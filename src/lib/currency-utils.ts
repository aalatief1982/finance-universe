import { CURRENCIES } from '@/lib/categories-data';
import { safeStorage } from '@/utils/safe-storage';

export const CUSTOM_CURRENCIES_KEY = 'xpensia_custom_currencies';

export type CustomCurrency = {
  code: string;
  country: string;
  conversionRate?: number;
  isCustom: boolean;
};

export function getAvailableCurrencies(): string[] {
  const base = [...CURRENCIES];
  const raw = safeStorage.getItem(CUSTOM_CURRENCIES_KEY);
  if (!raw) return base;

  try {
    const custom: CustomCurrency[] = JSON.parse(raw);
    return Array.from(new Set([...base, ...custom.map((c) => c.code.toUpperCase())]));
  } catch {
    return base;
  }
}

export function addCustomCurrency(currency: CustomCurrency): CustomCurrency[] {
  const normalized = {
    ...currency,
    code: currency.code.trim().toUpperCase(),
    country: currency.country.trim(),
    isCustom: true,
  };

  let existing: CustomCurrency[] = [];
  const raw = safeStorage.getItem(CUSTOM_CURRENCIES_KEY);
  if (raw) {
    try {
      existing = JSON.parse(raw);
    } catch {
      existing = [];
    }
  }

  const withoutDuplicate = existing.filter(
    (item) => item.code.trim().toUpperCase() !== normalized.code
  );
  const updated = [...withoutDuplicate, normalized];
  safeStorage.setItem(CUSTOM_CURRENCIES_KEY, JSON.stringify(updated));
  return updated;
}

