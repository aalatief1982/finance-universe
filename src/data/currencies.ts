export type CurrencyRegion = 'GCC' | 'MENA' | 'Europe' | 'Americas' | 'Asia-Pacific' | 'Africa';

export interface CurrencyData {
  code: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  region: CurrencyRegion;
}

export const CURRENCIES: CurrencyData[] = [
  { code: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', region: 'GCC' },
  { code: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', region: 'GCC' },
  { code: 'QAR', name: 'Qatari Riyal', country: 'Qatar', countryCode: 'QA', flag: '🇶🇦', region: 'GCC' },
  { code: 'KWD', name: 'Kuwaiti Dinar', country: 'Kuwait', countryCode: 'KW', flag: '🇰🇼', region: 'GCC' },
  { code: 'BHD', name: 'Bahraini Dinar', country: 'Bahrain', countryCode: 'BH', flag: '🇧🇭', region: 'GCC' },
  { code: 'OMR', name: 'Omani Rial', country: 'Oman', countryCode: 'OM', flag: '🇴🇲', region: 'GCC' },
  { code: 'EGP', name: 'Egyptian Pound', country: 'Egypt', countryCode: 'EG', flag: '🇪🇬', region: 'MENA' },
  { code: 'JOD', name: 'Jordanian Dinar', country: 'Jordan', countryCode: 'JO', flag: '🇯🇴', region: 'MENA' },
  { code: 'MAD', name: 'Moroccan Dirham', country: 'Morocco', countryCode: 'MA', flag: '🇲🇦', region: 'MENA' },
  { code: 'TRY', name: 'Turkish Lira', country: 'Turkey', countryCode: 'TR', flag: '🇹🇷', region: 'MENA' },
  { code: 'USD', name: 'US Dollar', country: 'United States', countryCode: 'US', flag: '🇺🇸', region: 'Americas' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', region: 'Americas' },
  { code: 'EUR', name: 'Euro', country: 'European Union', countryCode: 'EU', flag: '🇪🇺', region: 'Europe' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', region: 'Europe' },
  { code: 'CHF', name: 'Swiss Franc', country: 'Switzerland', countryCode: 'CH', flag: '🇨🇭', region: 'Europe' },
  { code: 'INR', name: 'Indian Rupee', country: 'India', countryCode: 'IN', flag: '🇮🇳', region: 'Asia-Pacific' },
  { code: 'CNY', name: 'Chinese Yuan', country: 'China', countryCode: 'CN', flag: '🇨🇳', region: 'Asia-Pacific' },
  { code: 'JPY', name: 'Japanese Yen', country: 'Japan', countryCode: 'JP', flag: '🇯🇵', region: 'Asia-Pacific' },
  { code: 'AUD', name: 'Australian Dollar', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', region: 'Asia-Pacific' },
];
