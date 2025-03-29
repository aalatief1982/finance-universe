
/**
 * This file provides a unified interface for accessing environment variables
 * and provides fallbacks for development environments.
 */

export const getEnvironmentVariable = (key: string, defaultValue: string = ''): string => {
  // For Vite, environment variables are accessed through import.meta.env
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Fallback to window._env if available (for runtime configuration)
  if (typeof window !== 'undefined' && window._env && window._env[key]) {
    return window._env[key];
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
export const SUPABASE_URL = getEnvironmentVariable('VITE_SUPABASE_URL', '');
export const SUPABASE_ANON_KEY = getEnvironmentVariable('VITE_SUPABASE_ANON_KEY', '');

// Feature flags
export const ENABLE_SUPABASE_AUTH = getEnvironmentVariable('VITE_ENABLE_SUPABASE_AUTH', 'false') === 'true';
export const ENABLE_SMS_INTEGRATION = getEnvironmentVariable('VITE_ENABLE_SMS_INTEGRATION', 'true') === 'true';

// Configuration options
export const DEFAULT_CURRENCY = getEnvironmentVariable('VITE_DEFAULT_CURRENCY', 'USD');
export const APP_VERSION = getEnvironmentVariable('VITE_APP_VERSION', '1.0.0');
