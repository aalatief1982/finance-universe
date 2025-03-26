
export type SupportedLocale = 
  | 'en-US' 
  | 'en-GB' 
  | 'es-ES' 
  | 'fr-FR' 
  | 'de-DE' 
  | 'ja-JP';

export type SupportedCurrency = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'JPY' 
  | 'CAD' 
  | 'AUD';

export interface LocaleSettings {
  locale: SupportedLocale;
  currency: SupportedCurrency;
  dateFormat: string;
  timeFormat: string;
}

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
}
