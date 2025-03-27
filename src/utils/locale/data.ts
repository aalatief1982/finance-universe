
import { SupportedLocale, SupportedCurrency, CurrencyInfo } from '@/types/locale';

// Currency information lookup - we're only implementing a subset of the currencies for now
// Note: This is a partial implementation. In a real app, all currencies from SupportedCurrency would be included
export const CURRENCY_INFO: Partial<Record<SupportedCurrency, CurrencyInfo>> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    namePlural: 'US Dollars',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    namePlural: 'Euros',
    decimalPlaces: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ',',
    spaceBetweenAmountAndSymbol: true
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    namePlural: 'British Pounds',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    namePlural: 'Japanese Yen',
    decimalPlaces: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    namePlural: 'Canadian Dollars',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    namePlural: 'Australian Dollars',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    namePlural: 'Swiss Francs',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: '\'',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    namePlural: 'Chinese Yuan',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    namePlural: 'Indian Rupees',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false
  }
};

// Locale information mapping - we're only implementing a subset of locales for now
// Note: This is a partial implementation. In a real app, all locales from SupportedLocale would be included
export const LOCALE_DISPLAY_NAMES: Partial<Record<SupportedLocale, string>> = {
  'en-US': 'English (United States)',
  'en-GB': 'English (United Kingdom)',
  'es-ES': 'Español (España)',
  'fr-FR': 'Français (France)',
  'de-DE': 'Deutsch (Deutschland)',
  'ja-JP': '日本語 (日本)',
  'zh-CN': '中文 (中国)',
  'pt-BR': 'Português (Brasil)',
  'it-IT': 'Italiano (Italia)',
  'ru-RU': 'Русский (Россия)'
};

// Day of week mapping - we're only implementing a subset for now
export const DAYS_OF_WEEK: Partial<Record<SupportedLocale, string[]>> = {
  'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'en-GB': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'es-ES': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  'fr-FR': ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  'de-DE': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  'ja-JP': ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  'zh-CN': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  'pt-BR': ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  'it-IT': ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  'ru-RU': ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
};

// Month names mapping - partial implementation
export const MONTH_NAMES: Partial<Record<SupportedLocale, string[]>> = {
  'en-US': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  'en-GB': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  'es-ES': ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  'fr-FR': ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  'de-DE': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  'ja-JP': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  'zh-CN': ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  'pt-BR': ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  'it-IT': ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  'ru-RU': ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
};

// First day of week by locale - partial implementation
export const FIRST_DAY_OF_WEEK: Partial<Record<SupportedLocale, 0 | 1>> = {
  'en-US': 0, // Sunday
  'en-GB': 1, // Monday
  'es-ES': 1, // Monday
  'fr-FR': 1, // Monday
  'de-DE': 1, // Monday
  'ja-JP': 0, // Sunday
  'zh-CN': 1, // Monday
  'pt-BR': 0, // Sunday
  'it-IT': 1, // Monday
  'ru-RU': 1  // Monday
};
