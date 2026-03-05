/**
 * Tier benefits (Premium/Pro) — admin-editable via Admin Hub; app reads for premium/pro/compare screens.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type TierBenefitsConfig,
  DEFAULT_TIER_BENEFITS,
  TIER_BENEFITS_STORAGE_KEY,
} from '../constants/TierBenefits';

function parseStored(raw: string | null): TierBenefitsConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TierBenefitsConfig>;
    const ensureArray = (arr: unknown): { title: string; sub: string }[] =>
      Array.isArray(arr) ? arr.filter((x) => x && typeof x.title === 'string').map((x) => ({ title: String(x.title), sub: typeof x.sub === 'string' ? x.sub : '' })) : [];
    return {
      premiumUser: ensureArray(parsed.premiumUser).length > 0 ? ensureArray(parsed.premiumUser) : DEFAULT_TIER_BENEFITS.premiumUser,
      premiumPartner: ensureArray(parsed.premiumPartner).length > 0 ? ensureArray(parsed.premiumPartner) : DEFAULT_TIER_BENEFITS.premiumPartner,
      proUser: ensureArray(parsed.proUser).length > 0 ? ensureArray(parsed.proUser) : DEFAULT_TIER_BENEFITS.proUser,
      proPartner: ensureArray(parsed.proPartner).length > 0 ? ensureArray(parsed.proPartner) : DEFAULT_TIER_BENEFITS.proPartner,
    };
  } catch {
    return null;
  }
}

export function useTierBenefits() {
  const [config, setConfig] = useState<TierBenefitsConfig>(DEFAULT_TIER_BENEFITS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TIER_BENEFITS_STORAGE_KEY);
        const stored = parseStored(raw);
        if (stored) setConfig(stored);
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveConfig = useCallback(async (next: TierBenefitsConfig) => {
    setConfig(next);
    try {
      await AsyncStorage.setItem(TIER_BENEFITS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      if (__DEV__) console.warn('Tier benefits save error:', e);
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    setConfig(DEFAULT_TIER_BENEFITS);
    try {
      await AsyncStorage.setItem(TIER_BENEFITS_STORAGE_KEY, JSON.stringify(DEFAULT_TIER_BENEFITS));
    } catch (e) {
      if (__DEV__) console.warn('Tier benefits reset error:', e);
    }
  }, []);

  return { config, loading, saveConfig, resetToDefaults, defaults: DEFAULT_TIER_BENEFITS };
}
