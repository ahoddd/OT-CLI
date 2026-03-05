/**
 * OrbVote quotas — load/save from AsyncStorage. Admin can adjust in Admin Hub System section.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type OrbVoteQuotasConfig,
  DEFAULT_ORBVOTE_QUOTAS,
  ORBVOTE_QUOTAS_STORAGE_KEY,
} from '../constants/OrbVoteConfig';

export function useOrbVoteConfig() {
  const [config, setConfig] = useState<OrbVoteQuotasConfig>(DEFAULT_ORBVOTE_QUOTAS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ORBVOTE_QUOTAS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<OrbVoteQuotasConfig>;
          setConfig({
            businessFreeTierPollsPerMonth: typeof parsed.businessFreeTierPollsPerMonth === 'number' ? parsed.businessFreeTierPollsPerMonth : DEFAULT_ORBVOTE_QUOTAS.businessFreeTierPollsPerMonth,
            businessPremiumTierPollsPerMonth: typeof parsed.businessPremiumTierPollsPerMonth === 'number' ? parsed.businessPremiumTierPollsPerMonth : DEFAULT_ORBVOTE_QUOTAS.businessPremiumTierPollsPerMonth,
            adminUnlimited: typeof parsed.adminUnlimited === 'boolean' ? parsed.adminUnlimited : DEFAULT_ORBVOTE_QUOTAS.adminUnlimited,
          });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveConfig = useCallback(async (next: OrbVoteQuotasConfig) => {
    setConfig(next);
    try {
      await AsyncStorage.setItem(ORBVOTE_QUOTAS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      if (__DEV__) console.warn('OrbVote config save error:', e);
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    setConfig(DEFAULT_ORBVOTE_QUOTAS);
    try {
      await AsyncStorage.setItem(ORBVOTE_QUOTAS_STORAGE_KEY, JSON.stringify(DEFAULT_ORBVOTE_QUOTAS));
    } catch (e) {
      if (__DEV__) console.warn('OrbVote config reset error:', e);
    }
  }, []);

  return { config, loading, saveConfig, resetToDefaults };
}
