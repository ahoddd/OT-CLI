import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

/** Content mode: moderated = profanity/immoral/illegal filtered; freeSpeech = illegal only (user opt-in). */
export type ContentMode = 'moderated' | 'freeSpeech';

export interface Preferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  biometrics: boolean;
  location: boolean;
  haptics: boolean;
  partnerMode: boolean;
  /** Premium membership — unlocks badge, advanced stats, early access, etc. */
  premiumMember: boolean;
  /** OrbScope: Daily Vibe — opt-in only, default OFF */
  orbScopeEnabled: boolean;
  /** Content mode: moderated (default) or free speech (illegal only filtered) */
  contentMode: ContentMode;
  shareMessage: string;
  themePreference: ThemePreference;
  /** Set after user completes post-signup onboarding (theme + welcome flow). */
  onboardingComplete: boolean;
}

const PREFS_KEY = 'ORBTAP_PREFS_V2';

/** Push notifications are on by default; user can turn off in Settings → Notification preferences. */
const DEFAULT_PREFS: Preferences = {
  pushEnabled: true,
  emailEnabled: true,
  biometrics: false,
  location: true,
  haptics: true,
  partnerMode: false,
  premiumMember: false,
  orbScopeEnabled: false,
  contentMode: 'moderated',
  shareMessage: 'Join me on the Grid. 🚀',
  themePreference: 'system',
  onboardingComplete: false,
};

type PreferencesContextType = {
  prefs: Preferences;
  loading: boolean;
  togglePref: (key: keyof Preferences) => void;
  setShareMessage: (msg: string) => void;
  setThemePreference: (value: ThemePreference) => void;
  setContentMode: (value: ContentMode) => void;
  setPremiumMember: (value: boolean) => void;
  setPartnerMode: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(PREFS_KEY);
        if (data) {
          const parsed = JSON.parse(data) as Partial<Preferences> & Record<string, unknown>;
          setPrefs({
            ...DEFAULT_PREFS,
            ...parsed,
            premiumMember: parsed.premiumMember ?? false,
            orbScopeEnabled: parsed.orbScopeEnabled ?? false,
            contentMode: (parsed.contentMode === 'freeSpeech' ? 'freeSpeech' : 'moderated') as ContentMode,
            onboardingComplete: parsed.onboardingComplete ?? false,
          });
        }
      } catch (e) {
        if (__DEV__) console.error('Preferences load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (p: Preferences) => {
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {
      if (__DEV__) console.error('Preferences save error', e);
    }
  }, []);

  const togglePref = useCallback(
    (key: keyof Preferences) => {
      const newPrefs = { ...prefs, [key]: !prefs[key] };
      setPrefs(newPrefs);
      save(newPrefs);
    },
    [prefs, save]
  );

  const setShareMessage = useCallback(
    (msg: string) => {
      const newPrefs = { ...prefs, shareMessage: msg };
      setPrefs(newPrefs);
      save(newPrefs);
    },
    [prefs, save]
  );

  const setThemePreference = useCallback(
    (value: ThemePreference) => {
      const newPrefs = { ...prefs, themePreference: value };
      setPrefs(newPrefs);
      save(newPrefs);
    },
    [prefs, save]
  );

  const setContentMode = useCallback(
    (value: ContentMode) => {
      const newPrefs = { ...prefs, contentMode: value };
      setPrefs(newPrefs);
      save(newPrefs);
    },
    [prefs, save]
  );

  const setPremiumMember = useCallback(
    (value: boolean) => {
      const newPrefs = { ...prefs, premiumMember: value };
      setPrefs(newPrefs);
      save(newPrefs);
    },
    [prefs, save]
  );

  const setPartnerMode = useCallback(
    (value: boolean) => {
      const newPrefs = { ...prefs, partnerMode: value };
      setPrefs(newPrefs);
      save(newPrefs);
    },
    [prefs, save]
  );

  const setOnboardingComplete = useCallback(
    (value: boolean) => {
      const newPrefs = { ...prefs, onboardingComplete: value };
      setPrefs(newPrefs);
      save(newPrefs);
    },
    [prefs, save]
  );

  return (
    <PreferencesContext.Provider
      value={{ prefs, loading, togglePref, setShareMessage, setThemePreference, setContentMode, setPremiumMember, setPartnerMode, setOnboardingComplete }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferencesContext = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferencesContext must be used within PreferencesProvider');
  return ctx;
};
