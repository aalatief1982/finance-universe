
// Feature flags and environment configuration

// Enable demo mode for development and testing
export const ENABLE_DEMO_MODE = true;

// Enable Supabase authentication (set to false for development without Supabase)
export const ENABLE_SUPABASE_AUTH = false;

// API configuration - use window.ENV if available (for production) or fallback to default
export const API_URL = (window as any).ENV?.REACT_APP_API_URL || 'https://api.example.com';

// App version
export const APP_VERSION = '0.1.0';

// Default locale
export const DEFAULT_LOCALE = 'en-US';

// Default currency
export const DEFAULT_CURRENCY = 'USD';

// Maximum number of recent transactions to show on dashboard
export const MAX_RECENT_TRANSACTIONS = 5;

// Enable debug logging
export const ENABLE_DEBUG_LOGGING = (window.location.hostname === 'localhost' || 
                                    window.location.hostname === '127.0.0.1');

// Maximum SMS messages to process in a batch
export const MAX_SMS_BATCH_SIZE = 50;

// Maximum days of SMS history to analyze
export const MAX_SMS_HISTORY_DAYS = 90;

// Supabase configuration
export const SUPABASE_URL = (window as any).ENV?.REACT_APP_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = (window as any).ENV?.REACT_APP_SUPABASE_ANON_KEY || '';
