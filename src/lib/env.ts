import { safeStorage } from "@/utils/safe-storage";

/**
 * This file provides a unified interface for accessing environment variables
 * and provides fallbacks for development environments.
 */

export const getEnvironmentVariable = (key: string, defaultValue: string = ''): string => {
  // For Vite, environment variables are accessed through import.meta.env
  const envKey = `VITE_${key.replace(/^VITE_/, '')}`;
  
  if (import.meta.env[envKey]) {
    return import.meta.env[envKey];
  }
  
  // Fallback to window._env if available (for runtime configuration)
  if (typeof window !== 'undefined' && window._env && window._env[envKey]) {
    return window._env[envKey];
  }
  
  return defaultValue;
};

// Declare the _env property on the window object for TypeScript
declare global {
  interface Window {
    _env?: Record<string, string>;
  }
}

// Supabase configuration
export const SUPABASE_URL = getEnvironmentVariable('SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvironmentVariable('SUPABASE_ANON_KEY');

// Feature flags
export const ENABLE_SUPABASE_AUTH = getEnvironmentVariable('ENABLE_SUPABASE_AUTH', 'false') === 'true';
export const ENABLE_SMS_INTEGRATION = getEnvironmentVariable('ENABLE_SMS_INTEGRATION', 'true') === 'true';
export const ENABLE_DEMO_MODE = getEnvironmentVariable('ENABLE_DEMO_MODE', 'false') === 'true';  // Set to false for real device testing

// Configuration options
export const DEFAULT_CURRENCY = getEnvironmentVariable('DEFAULT_CURRENCY', 'USD');

// Beta features default state - set to 'false' to gate new beta features
export const BETA_DEFAULT = getEnvironmentVariable('BETA_DEFAULT', 'true') === 'true';
export const APP_VERSION = getEnvironmentVariable('APP_VERSION', '1.0.0');
export const CLOUD_FUNCTIONS_BASE_URL = getEnvironmentVariable(
  'CLOUD_FUNCTIONS_BASE_URL',
  'https://us-central1-xpensia-505ac.cloudfunctions.net'
);

// Default SMS look-back period (in months) used when no user preference is set
export const VITE_SMS_LOOKBACK_MONTHS = parseInt(
  getEnvironmentVariable('SMS_LOOKBACK_MONTHS', '6'),
  10
);

/**
 * Returns the SMS look-back period in months.
 *
 * The value is determined by checking the `xpensia_sms_period_months`
 * entry in local storage. If no user preference is stored, the
 * `VITE_SMS_LOOKBACK_MONTHS` environment variable is used and the
 * value is persisted to local storage for future calls.
 */
export const getSmsLookbackMonths = (): number => {
  try {
    const stored = safeStorage.getItem('xpensia_sms_period_months');
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    } else {
      safeStorage.setItem('xpensia_sms_period_months', String(VITE_SMS_LOOKBACK_MONTHS));
    }
  } catch {
    // Ignore storage errors and fall back to env default
  }

  return VITE_SMS_LOOKBACK_MONTHS;
};
