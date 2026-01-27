import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'ORBTAP_PREFS_V2';

export interface Preferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  biometrics: boolean;
  location: boolean;
  haptics: boolean;
  partnerMode: boolean;
  shareMessage: string; // NEW
}

const DEFAULT_PREFS: Preferences = {
  pushEnabled: true,
  emailEnabled: true,
  biometrics: false,
  location: true,
  haptics: true,
  partnerMode: false,
  shareMessage: "Join me on the Grid. 🚀", // Default
};

export const usePreferences = () => {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const data = await AsyncStorage.getItem(PREFS_KEY);
      if (data) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(data) });
      }
    } catch (e) {
      console.error("Failed to load prefs", e);
    } finally {
      setLoading(false);
    }
  };

  const togglePref = async (key: keyof Preferences) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    save(newPrefs);
  };

  const setShareMessage = async (msg: string) => {
    const newPrefs = { ...prefs, shareMessage: msg };
    setPrefs(newPrefs);
    save(newPrefs);
  };

  const save = async (p: Preferences) => {
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {
      console.error("Failed to save prefs", e);
    }
  };

  return { prefs, togglePref, setShareMessage, loading };
};
