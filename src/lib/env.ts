
// Environment variables
export const ENABLE_DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const CURRENCY_API_KEY = import.meta.env.VITE_CURRENCY_API_KEY;
