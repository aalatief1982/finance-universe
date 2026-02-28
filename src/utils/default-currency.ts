import { CURRENCIES } from '@/lib/categories-data';
import { safeStorage } from '@/utils/safe-storage';

const USER_SETTINGS_STORAGE_KEY = 'xpensia_user_settings';
const DEFAULT_CURRENCY_REQUIRED_KEY = 'xpensia_default_currency_required';
const FALLBACK_CURRENCY = 'USD';

type StoredSettings = {
  currency?: unknown;
  defaultCurrency?: unknown;
};

const getStoredCurrencyValue = (): string | null => {
  try {
    const raw = safeStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredSettings;
    const candidate = typeof parsed.defaultCurrency === 'string'
      ? parsed.defaultCurrency
      : parsed.currency;

    if (typeof candidate !== 'string') {
      return null;
    }

    return candidate.toUpperCase();
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

export const setDefaultCurrencyRequired = (required: boolean): void => {
  safeStorage.setItem(DEFAULT_CURRENCY_REQUIRED_KEY, required ? 'true' : 'false');
};

export const isDefaultCurrencySelectionRequired = (): boolean => {
  const requiredFlag = safeStorage.getItem(DEFAULT_CURRENCY_REQUIRED_KEY) === 'true';
  return requiredFlag || !isDefaultCurrencySet();
};

export const markDefaultCurrencySelectionCompleted = (): void => {
  setDefaultCurrencyRequired(false);
};

export const getCurrencyOrAppFallback = (): string => getDefaultCurrency() ?? FALLBACK_CURRENCY;
