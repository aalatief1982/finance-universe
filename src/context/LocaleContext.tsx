import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';

export type Translations = Record<string, string>;

interface LocaleContextType {
  language: string;
  translations: Translations;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  language: 'en',
  translations: {},
  setLanguage: async () => {},
  t: (key: string) => key,
});

// ✅ Eagerly load all translations at build time
const translationFiles = import.meta.glob('../locales/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, Translations>;

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [translations, setTranslations] = useState<Translations>({});

  // ✅ Use direct object access (no await) for eagerly loaded translations
  const loadTranslations = async (lang: string) => {
    const msgs = translationFiles[`../locales/${lang}.json`];
    if (msgs) {
      setTranslations(msgs);
    } else {
      console.error(`Translations for ${lang} not found`);
      setTranslations({});
    }
  };

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    await loadTranslations(lang);
  };

  useEffect(() => {
    const stored = localStorage.getItem('language') || 'en';
    setLanguage(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback(
    (key: string) => translations[key] || key,
    [translations]
  );

  return (
    <LocaleContext.Provider value={{ language, translations, setLanguage, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);

export default LocaleContext;
