/**
 * Daily Orb Ritual config — load/save from AsyncStorage. Admin edits in Admin Hub.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type DailyOrbRitualConfig,
  DEFAULT_DAILY_RITUAL_CONFIG,
  DAILY_RITUAL_CONFIG_STORAGE_KEY,
} from '../constants/DailyRitualConfig';

export function useDailyRitualConfig() {
  const [config, setConfig] = useState<DailyOrbRitualConfig>(DEFAULT_DAILY_RITUAL_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DAILY_RITUAL_CONFIG_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DailyOrbRitualConfig>;
          setConfig({
            ...DEFAULT_DAILY_RITUAL_CONFIG,
            ...parsed,
            points: { ...DEFAULT_DAILY_RITUAL_CONFIG.points, ...parsed.points },
            badges: { ...DEFAULT_DAILY_RITUAL_CONFIG.badges, ...parsed.badges },
            eligibility: { ...DEFAULT_DAILY_RITUAL_CONFIG.eligibility, ...parsed.eligibility },
            audit: parsed.audit ?? DEFAULT_DAILY_RITUAL_CONFIG.audit,
          });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveConfig = useCallback(async (next: DailyOrbRitualConfig, updatedBy?: string) => {
    const withAudit: DailyOrbRitualConfig = {
      ...next,
      audit: { updatedAt: Date.now(), updatedBy: updatedBy ?? 'admin' },
    };
    setConfig(withAudit);
    try {
      await AsyncStorage.setItem(DAILY_RITUAL_CONFIG_STORAGE_KEY, JSON.stringify(withAudit));
    } catch (e) {
      if (__DEV__) console.warn('Daily ritual config save error:', e);
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    setConfig(DEFAULT_DAILY_RITUAL_CONFIG);
    try {
      await AsyncStorage.setItem(DAILY_RITUAL_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_DAILY_RITUAL_CONFIG));
    } catch (e) {
      if (__DEV__) console.warn('Daily ritual config reset error:', e);
    }
  }, []);

  return { config, loading, saveConfig, resetToDefaults };
}
