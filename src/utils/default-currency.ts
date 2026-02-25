import { CURRENCIES } from '@/lib/categories-data';
import { safeStorage } from '@/utils/safe-storage';

const USER_SETTINGS_STORAGE_KEY = 'xpensia_user_settings';
const FALLBACK_CURRENCY = 'USD';

type StoredSettings = {
  currency?: unknown;
};

const getStoredCurrencyValue = (): string | null => {
  try {
    const raw = safeStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredSettings;
    if (typeof parsed.currency !== 'string') {
      return null;
    }

    return parsed.currency.toUpperCase();
  } catch {
    return null;
  }
};

export const getDefaultCurrency = (): string | null => {
  const storedCurrency = getStoredCurrencyValue();
  if (!storedCurrency || !CURRENCIES.includes(storedCurrency)) {
    return null;
  }

  return storedCurrency;
};

export const isDefaultCurrencySet = (): boolean => getDefaultCurrency() !== null;

export const getCurrencyOrAppFallback = (): string => getDefaultCurrency() ?? FALLBACK_CURRENCY;
