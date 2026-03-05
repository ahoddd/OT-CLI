/**
 * OrbTap i18n — lightweight localization with expo-localization + i18n-js.
 * Auto-detect device locale, fallback to English, RTL for Arabic.
 */

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ORBTAP_LANGUAGE_V1';

export type SupportedLocale =
  | 'en'
  | 'es'
  | 'ar'
  | 'fr'
  | 'pt'
  | 'de'
  | 'it'
  | 'hi';

const SUPPORTED_LOCALES: SupportedLocale[] = [
  'en',
  'es',
  'ar',
  'fr',
  'pt',
  'de',
  'it',
  'hi',
];

/** Map device locale tag to our supported code */
function deviceLocaleToSupported(
  deviceLocales: string[] = Localization.getLocales().map((l) => l.languageTag)
): SupportedLocale {
  for (const tag of deviceLocales) {
    const lower = (tag || '').toLowerCase();
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('pt')) return 'pt';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('de')) return 'de';
    if (lower.startsWith('it')) return 'it';
    if (lower.startsWith('hi')) return 'hi';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

// Lazy-load translation objects to avoid requiring all JSON at once
const localeModules: Record<SupportedLocale, () => Record<string, unknown>> = {
  en: () => require('../constants/locales/en.json'),
  es: () => require('../constants/locales/es.json'),
  ar: () => require('../constants/locales/ar.json'),
  fr: () => require('../constants/locales/fr.json'),
  pt: () => require('../constants/locales/pt.json'),
  de: () => require('../constants/locales/de.json'),
  it: () => require('../constants/locales/it.json'),
  hi: () => require('../constants/locales/hi.json'),
};

const i18n = new I18n(
  Object.fromEntries(
    SUPPORTED_LOCALES.map((code) => [code, localeModules[code]()])
  )
);

i18n.defaultLocale = 'en';
i18n.enableFallback = true;
i18n.missingBehavior = 'guess';
i18n.missingTranslationPrefix = '';

let currentStored: 'system' | SupportedLocale = 'system';
let resolvedLocale: SupportedLocale = 'en';

function getResolvedLocale(): SupportedLocale {
  if (currentStored === 'system') {
    return deviceLocaleToSupported();
  }
  return currentStored;
}

function applyLocale(locale: SupportedLocale) {
  resolvedLocale = locale;
  i18n.locale = locale;
  const wantRTL = locale === 'ar';
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.forceRTL(wantRTL);
    // Caller should show "Restart app to apply RTL" and optionally reload
  }
}

/** Initialize from storage and device; call early in app lifecycle */
export async function initI18n(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'system' || stored === null) {
      currentStored = 'system';
    } else if (SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      currentStored = stored as SupportedLocale;
    }
  } catch {
    currentStored = 'system';
  }
  applyLocale(getResolvedLocale());
}

/** Translate: t('auth.signIn') or t('auth.mustBeAge', { age: 13 }) */
export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  const result = i18n.t(key, params as Record<string, unknown>);
  if (__DEV__ && typeof result === 'string' && result === key) {
    // i18n-js returns key when missing in some setups; fallback to en
    const enDict = localeModules.en() as Record<string, unknown>;
    const segments = key.split('.');
    let val: unknown = enDict;
    for (const seg of segments) {
      val = (val as Record<string, unknown>)?.[seg];
    }
    if (typeof val === 'string') return val;
    if (__DEV__) console.warn('[i18n] missing key:', key);
  }
  return typeof result === 'string' ? result : key;
}

/** Set language: 'system' or a supported code. Persists to AsyncStorage. */
export async function setLanguage(
  lang: 'system' | SupportedLocale
): Promise<boolean> {
  const prevRTL = getIsRTL();
  currentStored = lang;
  const nextLocale = getResolvedLocale();
  applyLocale(nextLocale);
  const nextRTL = nextLocale === 'ar';
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    if (__DEV__) console.warn('[i18n] setLanguage storage failed', e);
  }
  return prevRTL !== nextRTL;
}

/** Current effective language code */
export function getLanguage(): SupportedLocale {
  return resolvedLocale;
}

/** Stored preference: 'system' or a locale code */
export function getStoredLanguage(): 'system' | SupportedLocale {
  return currentStored;
}

/** Whether current locale is RTL (Arabic) */
export function getIsRTL(): boolean {
  return resolvedLocale === 'ar';
}

/** Supported locale codes and their display names (in their own language for picker) */
export const LOCALE_DISPLAY_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  ar: 'العربية',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  it: 'Italiano',
  hi: 'हिन्दी',
};

export { SUPPORTED_LOCALES };

// Initialize with device locale so t() works before async initI18n()
resolvedLocale = deviceLocaleToSupported();
applyLocale(resolvedLocale);
