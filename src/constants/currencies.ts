import { SupportedCurrency } from '@/types/locale';

export type CurrencyGroup = 'MENA' | 'MAJORS' | 'OTHER';

export interface CurrencyOption {
  code: SupportedCurrency;
  name: string;
  group: CurrencyGroup;
  flag: string;
}

export const CURRENCY_GROUP_ORDER: CurrencyGroup[] = ['MENA', 'MAJORS', 'OTHER'];

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  // MENA / GCC
  { code: 'SAR', name: 'Saudi Riyal', group: 'MENA', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', group: 'MENA', flag: '🇦🇪' },
  { code: 'BHD', name: 'Bahraini Dinar', group: 'MENA', flag: '🇧🇭' },
  { code: 'KWD', name: 'Kuwaiti Dinar', group: 'MENA', flag: '🇰🇼' },
  { code: 'QAR', name: 'Qatari Riyal', group: 'MENA', flag: '🇶🇦' },
  { code: 'OMR', name: 'Omani Rial', group: 'MENA', flag: '🇴🇲' },
  { code: 'JOD', name: 'Jordanian Dinar', group: 'MENA', flag: '🇯🇴' },
  { code: 'EGP', name: 'Egyptian Pound', group: 'MENA', flag: '🇪🇬' },
  { code: 'MAD', name: 'Moroccan Dirham', group: 'MENA', flag: '🇲🇦' },
  { code: 'TRY', name: 'Turkish Lira', group: 'MENA', flag: '🇹🇷' },

  // Global majors
  { code: 'USD', name: 'US Dollar', group: 'MAJORS', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', group: 'MAJORS', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', group: 'MAJORS', flag: '🇬🇧' },
  { code: 'CHF', name: 'Swiss Franc', group: 'MAJORS', flag: '🇨🇭' },
  { code: 'JPY', name: 'Japanese Yen', group: 'MAJORS', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', group: 'MAJORS', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', group: 'MAJORS', flag: '🇦🇺' },

  // High-coverage travel / remittance + existing supported picks
  { code: 'INR', name: 'Indian Rupee', group: 'OTHER', flag: '🇮🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', group: 'OTHER', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', group: 'OTHER', flag: '🇧🇩' },
  { code: 'PHP', name: 'Philippine Peso', group: 'OTHER', flag: '🇵🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', group: 'OTHER', flag: '🇮🇩' },
  { code: 'CNY', name: 'Chinese Yuan', group: 'OTHER', flag: '🇨🇳' },
];

export const CURRENCY_GROUP_LABELS: Record<CurrencyGroup, string> = {
  MENA: 'MENA / GCC',
  MAJORS: 'Global Majors',
  OTHER: 'Travel / Remittance',
};

export const CURRENCY_OPTION_MAP = new Map(
  CURRENCY_OPTIONS.map((currency) => [currency.code, currency])
);
