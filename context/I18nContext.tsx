/**
 * React context for i18n — provides t() and setLanguage so UI re-renders when language changes.
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  initI18n,
  setLanguage as setI18nLanguage,
  getLanguage,
  getStoredLanguage,
  getIsRTL,
  t as tFn,
  SUPPORTED_LOCALES,
  LOCALE_DISPLAY_NAMES,
  type SupportedLocale,
} from '../utils/i18n';

type I18nContextType = {
  locale: SupportedLocale;
  storedLanguage: 'system' | SupportedLocale;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage: (lang: 'system' | SupportedLocale) => Promise<boolean>;
  supportedLocales: readonly SupportedLocale[];
  localeDisplayNames: typeof LOCALE_DISPLAY_NAMES;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(getLanguage());

  useEffect(() => {
    initI18n().then(() => {
      setLocale(getLanguage());
    });
  }, []);

  const setLanguage = useCallback(async (lang: 'system' | SupportedLocale) => {
    const rtlChanged = await setI18nLanguage(lang);
    setLocale(getLanguage());
    return rtlChanged;
  }, []);

  const value: I18nContextType = {
    locale,
    storedLanguage: getStoredLanguage(),
    isRTL: getIsRTL(),
    t: tFn,
    setLanguage,
    supportedLocales: SUPPORTED_LOCALES,
    localeDisplayNames: LOCALE_DISPLAY_NAMES,
  };

  // Key by locale so the entire app tree remounts when language changes — ensures
  // every screen and component re-renders with the new language.
  return (
    <I18nContext.Provider value={value}>
      <React.Fragment key={locale}>{children}</React.Fragment>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
