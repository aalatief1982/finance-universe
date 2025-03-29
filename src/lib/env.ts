
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
export const SUPABASE_URL = getEnvironmentVariable('SUPABASE_URL', '');
export const SUPABASE_ANON_KEY = getEnvironmentVariable('SUPABASE_ANON_KEY', '');

// Feature flags
export const ENABLE_SUPABASE_AUTH = getEnvironmentVariable('ENABLE_SUPABASE_AUTH', 'false') === 'true';
export const ENABLE_SMS_INTEGRATION = getEnvironmentVariable('ENABLE_SMS_INTEGRATION', 'true') === 'true';

// Configuration options
export const DEFAULT_CURRENCY = getEnvironmentVariable('DEFAULT_CURRENCY', 'USD');
export const APP_VERSION = getEnvironmentVariable('APP_VERSION', '1.0.0');
