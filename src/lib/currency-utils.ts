import { CURRENCIES, type CurrencyData, type CurrencyRegion } from '@/data/currencies';
import { safeStorage } from '@/utils/safe-storage';

export const CUSTOM_CURRENCIES_KEY = 'xpensia_custom_currencies';

export type CustomCurrency = {
  code: string;
  name?: string;
  country: string;
  countryCode?: string;
  flag?: string;
  region?: CurrencyRegion;
  conversionRate?: number;
  isCustom: boolean;
};

export type AvailableCurrency = CurrencyData & {
  isCustom?: boolean;
  conversionRate?: number;
};

const normalizeCustomCurrency = (currency: CustomCurrency): CustomCurrency => ({
  ...currency,
  code: currency.code.trim().toUpperCase(),
  name: currency.name?.trim() || `${currency.country.trim()} Currency`,
  country: currency.country.trim(),
  countryCode: currency.countryCode?.trim().toUpperCase() || 'XX',
  flag: currency.flag?.trim() || '🏳️',
  region: currency.region || 'MENA',
  isCustom: true,
});

export function getCustomCurrencies(): CustomCurrency[] {
  const raw = safeStorage.getItem(CUSTOM_CURRENCIES_KEY);
  if (!raw) return [];

  try {
    const parsed: CustomCurrency[] = JSON.parse(raw);
    return parsed.map(normalizeCustomCurrency);
  } catch {
    return [];
  }
}

export function getAvailableCurrencyOptions(): AvailableCurrency[] {
  const customCurrencies = getCustomCurrencies();

  const customOptions: AvailableCurrency[] = customCurrencies.map((currency) => ({
    code: currency.code,
    name: currency.name || `${currency.country} Currency`,
    country: currency.country,
    countryCode: currency.countryCode || 'XX',
    flag: currency.flag || '🏳️',
    region: currency.region || 'MENA',
    isCustom: true,
    conversionRate: currency.conversionRate,
  }));

  const merged = [...CURRENCIES, ...customOptions];
  const byCode = new Map<string, AvailableCurrency>();

  merged.forEach((currency) => {
    byCode.set(currency.code.toUpperCase(), {
      ...currency,
      code: currency.code.toUpperCase(),
    });
  });

  return Array.from(byCode.values());
}

export function getAvailableCurrencies(): string[] {
  return getAvailableCurrencyOptions().map((currency) => currency.code);
}

export function addCustomCurrency(currency: CustomCurrency): CustomCurrency[] {
  const normalized = normalizeCustomCurrency(currency);

  const existing = getCustomCurrencies();
  const withoutDuplicate = existing.filter(
    (item) => item.code.trim().toUpperCase() !== normalized.code,
  );
  const updated = [...withoutDuplicate, normalized];

  safeStorage.setItem(CUSTOM_CURRENCIES_KEY, JSON.stringify(updated));
  return updated;
}
