/**
 * @file envFlags.ts
 * @description Zero-dependency environment feature flags used during app startup.
 */

const getEnvironmentVariable = (key: string, defaultValue: string = ''): string => {
  const envKey = `VITE_${key.replace(/^VITE_/, '')}`;

  if (import.meta.env[envKey]) {
    return import.meta.env[envKey];
  }

  if (typeof window !== 'undefined' && window._env && window._env[envKey]) {
    return window._env[envKey];
  }

  return defaultValue;
};

export const SMS_STARTUP_IMPORT_ENABLED =
  getEnvironmentVariable('SMS_STARTUP_IMPORT_ENABLED', 'false') === 'true';

export const SMS_HISTORICAL_IMPORT_ENABLED = SMS_STARTUP_IMPORT_ENABLED;

export const CONFIDENCE_OVERLAY_ENABLED =
  getEnvironmentVariable('CONFIDENCE_OVERLAY_ENABLED', 'false') === 'true';
