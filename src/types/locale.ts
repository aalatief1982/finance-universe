/**
 * @file locale.ts
 * @description Type definitions for locale.
 *
 * @module types/locale
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */
// Expanded list of supported locales
export type SupportedLocale = 
  | 'en-US'  // English (United States)
  | 'en-GB'  // English (United Kingdom)
  | 'es-ES'  // Spanish (Spain)
  | 'es-MX'  // Spanish (Mexico)
  | 'fr-FR'  // French (France)
  | 'fr-CA'  // French (Canada)
  | 'de-DE'  // German (Germany)
  | 'it-IT'  // Italian (Italy)
  | 'pt-BR'  // Portuguese (Brazil)
  | 'pt-PT'  // Portuguese (Portugal)
  | 'nl-NL'  // Dutch (Netherlands)
  | 'ja-JP'  // Japanese (Japan)
  | 'zh-CN'  // Chinese (Simplified)
  | 'zh-TW'  // Chinese (Traditional)
  | 'ko-KR'  // Korean (Korea)
  | 'ru-RU'  // Russian (Russia)
  | 'ar-SA'  // Arabic (Saudi Arabia)
  | 'hi-IN'  // Hindi (India)
  | 'th-TH'  // Thai (Thailand)
  | 'tr-TR';  // Turkish (Turkey)

// Extended list of supported currencies
export type SupportedCurrency = 
  | 'USD'  // US Dollar
  | 'EUR'  // Euro
  | 'GBP'  // British Pound Sterling
  | 'JPY'  // Japanese Yen
  | 'CAD'  // Canadian Dollar
  | 'AUD'  // Australian Dollar
  | 'CHF'  // Swiss Franc
  | 'CNY'  // Chinese Yuan
  | 'HKD'  // Hong Kong Dollar
  | 'NZD'  // New Zealand Dollar
  | 'SEK'  // Swedish Krona
  | 'KRW'  // South Korean Won
  | 'SGD'  // Singapore Dollar
  | 'NOK'  // Norwegian Krone
  | 'MXN'  // Mexican Peso
  | 'INR'  // Indian Rupee
  | 'RUB'  // Russian Ruble
  | 'ZAR'  // South African Rand
  | 'BRL'  // Brazilian Real
  | 'AED'  // United Arab Emirates Dirham
  | 'SAR'  // Saudi Riyal
  | 'TRY'  // Turkish Lira
  | 'PLN'  // Polish Złoty
  | 'EGP'  // Egyptian Pound
  | 'BHD'  // Bahraini Dinar
  | string; // Allow any string to avoid type errors

// Enhanced locale settings interface
export interface LocaleSettings {
  locale: SupportedLocale;
  currency: SupportedCurrency;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: 0 | 1 | 6; // 0 for Sunday, 1 for Monday, 6 for Saturday
  timezone?: string; // IANA timezone strings like 'America/New_York'
  numberFormat?: {
    useGrouping: boolean;
    minimumFractionDigits: number;
    maximumFractionDigits: number;
  };
  measurementSystem?: 'metric' | 'imperial';
}

// Expanded currency information interface
export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
  spaceBetweenAmountAndSymbol: boolean;
  namePlural?: string;
  alternateSymbols?: string[];
  subUnit?: string;
  subUnitToUnit?: number;
  symbolOnLeft?: boolean;
  isCrypto?: boolean;
}

// Locale information with language details
export interface LocaleInfo {
  code: SupportedLocale;
  languageCode: string; // ISO 639-1
  countryCode: string; // ISO 3166-1 alpha-2
  languageName: string;
  nativeName: string;
  textDirection: 'ltr' | 'rtl';
  dateFormats: {
    short: string;
    medium: string;
    long: string;
    full: string;
  };
  timeFormats: {
    short: string;
    medium: string;
    long: string;
    full: string;
  };
  firstDayOfWeek: 0 | 1 | 6; // 0 for Sunday, 1 for Monday, 6 for Saturday
  weekdayNames: {
    narrow: string[];
    short: string[];
    long: string[];
  };
  monthNames: {
    narrow: string[];
    short: string[];
    long: string[];
  };
}

// Exchange rate information
export interface ExchangeRate {
  baseCurrency: SupportedCurrency;
  targetCurrency: SupportedCurrency;
  rate: number;
  timestamp: number; // Unix timestamp
  source?: string;
}

// Currency conversion result
export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: SupportedCurrency;
  convertedAmount: number;
  targetCurrency: SupportedCurrency;
  exchangeRate: number;
  timestamp: number; // Unix timestamp
  fees?: number;
}

// Format options for various formatting functions
export interface DateFormatOptions {
  format?: 'short' | 'medium' | 'long' | 'full' | 'custom';
  custom?: string; // Custom format string
  locale?: SupportedLocale;
  timezone?: string;
}

export interface TimeFormatOptions {
  format?: 'short' | 'medium' | 'long' | 'full' | 'custom';
  custom?: string; // Custom format string
  locale?: SupportedLocale;
  timezone?: string;
  hour12?: boolean;
}

export interface CurrencyFormatOptions {
  style?: 'symbol' | 'code' | 'name';
  showDecimals?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: SupportedLocale;
  compact?: boolean;
  hideSymbolOnZero?: boolean;
  showNegativeSign?: boolean;
  useParentheses?: boolean;
}

// Timezone information
export interface TimezoneInfo {
  id: string; // IANA timezone identifier
  name: string;
  abbreviation: string;
  offset: number; // in minutes
  isDST: boolean;
  offsetString: string; // e.g., UTC+02:00
}

// Countries data for selection
export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  nativeName: string;
  currency: SupportedCurrency;
  callingCode: string;
  flag: string; // emoji flag
  languages: string[]; // ISO 639-1 language codes
}
