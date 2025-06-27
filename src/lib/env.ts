
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
export const SUPABASE_URL = getEnvironmentVariable('SUPABASE_URL', 'https://cfacrxykzimdfzvbwhba.supabase.co');
export const SUPABASE_ANON_KEY = getEnvironmentVariable('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmYWNyeHlremltZGZ6dmJ3aGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDkxMzQsImV4cCI6MjA1ODgyNTEzNH0.x_ZGHodH9IYx5cgKRinAWQ2WpPX9iJaC32GfSKP0noY');

// Feature flags
export const ENABLE_SUPABASE_AUTH = getEnvironmentVariable('ENABLE_SUPABASE_AUTH', 'false') === 'true';
export const ENABLE_SMS_INTEGRATION = getEnvironmentVariable('ENABLE_SMS_INTEGRATION', 'true') === 'true';
export const ENABLE_DEMO_MODE = getEnvironmentVariable('ENABLE_DEMO_MODE', 'false') === 'true';  // Set to false for real device testing

// Configuration options
export const DEFAULT_CURRENCY = getEnvironmentVariable('DEFAULT_CURRENCY', 'USD');
export const APP_VERSION = getEnvironmentVariable('APP_VERSION', '1.0.0');
export const CLOUD_FUNCTIONS_BASE_URL = getEnvironmentVariable(
  'CLOUD_FUNCTIONS_BASE_URL',
  'https://us-central1-xpensia-505ac.cloudfunctions.net'
);
