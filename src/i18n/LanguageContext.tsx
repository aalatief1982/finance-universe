import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { en } from './en';
import { ar } from './ar';
import { safeStorage } from '@/utils/safe-storage';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = { en, ar };
const STORAGE_KEY = 'xpensia_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = safeStorage.getItem(STORAGE_KEY);
    return stored === 'ar' ? 'ar' : 'en';
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    safeStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Fallback so components don't crash if rendered before/outside LanguageProvider
// (e.g. during React Fast Refresh or HMR boundary resets)
const fallback: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => translations.en[key] ?? key,
  isRtl: false,
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  return ctx ?? fallback;
};
