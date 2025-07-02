
import { SupportedLocale, SupportedCurrency, LocaleSettings, CurrencyInfo } from '@/types/locale';

// Export commonly used type definitions from locale-related utilities
export type { 
  SupportedLocale, 
  SupportedCurrency, 
  LocaleSettings, 
  CurrencyInfo 
};

// Define the correct types for backupFrequency and dataRetention
export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'never';
export type DataRetention = '3months' | '6months' | '1year' | 'forever';
