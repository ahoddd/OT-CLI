/**
 * Missions config — load/save from AsyncStorage. Admin can adjust in Admin Hub.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type MissionsConfig,
  DEFAULT_MISSIONS_CONFIG,
  MISSIONS_CONFIG_STORAGE_KEY,
} from '../constants/MissionsConfig';

export function useMissionsConfig() {
  const [config, setConfig] = useState<MissionsConfig>(DEFAULT_MISSIONS_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(MISSIONS_CONFIG_STORAGE_KEY);
        if (!raw) {
          const v1 = await AsyncStorage.getItem('ORBTAP_MISSIONS_CONFIG_V1');
          if (v1) {
            raw = v1;
            await AsyncStorage.setItem(MISSIONS_CONFIG_STORAGE_KEY, v1);
          }
        }
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<MissionsConfig>;
          setConfig({
            rewardPointsPerMission: typeof parsed.rewardPointsPerMission === 'number' ? parsed.rewardPointsPerMission : DEFAULT_MISSIONS_CONFIG.rewardPointsPerMission,
            rewardSphereXpPerMission: typeof parsed.rewardSphereXpPerMission === 'number' ? parsed.rewardSphereXpPerMission : DEFAULT_MISSIONS_CONFIG.rewardSphereXpPerMission,
            missionPartnerIds: Array.isArray(parsed.missionPartnerIds) && parsed.missionPartnerIds.length >= 1 && parsed.missionPartnerIds.length <= 5
              ? parsed.missionPartnerIds.slice(0, 5)
              : DEFAULT_MISSIONS_CONFIG.missionPartnerIds,
            deadlineEndOfDay: typeof parsed.deadlineEndOfDay === 'boolean' ? parsed.deadlineEndOfDay : DEFAULT_MISSIONS_CONFIG.deadlineEndOfDay,
            deadlineHoursFromNow: typeof parsed.deadlineHoursFromNow === 'number' ? parsed.deadlineHoursFromNow : DEFAULT_MISSIONS_CONFIG.deadlineHoursFromNow,
            dailyFullCompletionBonusPoints: typeof parsed.dailyFullCompletionBonusPoints === 'number' ? parsed.dailyFullCompletionBonusPoints : DEFAULT_MISSIONS_CONFIG.dailyFullCompletionBonusPoints,
            maxStepsPerMission: typeof parsed.maxStepsPerMission === 'number' ? Math.min(3, Math.max(1, parsed.maxStepsPerMission)) : DEFAULT_MISSIONS_CONFIG.maxStepsPerMission,
            maxMissionsPerDay: typeof parsed.maxMissionsPerDay === 'number' ? Math.min(3, Math.max(1, parsed.maxMissionsPerDay)) : DEFAULT_MISSIONS_CONFIG.maxMissionsPerDay,
            missionsEnabled: typeof parsed.missionsEnabled === 'boolean' ? parsed.missionsEnabled : DEFAULT_MISSIONS_CONFIG.missionsEnabled,
            minMinutesBetweenSamePartnerCheckIn: typeof parsed.minMinutesBetweenSamePartnerCheckIn === 'number' ? Math.max(0, parsed.minMinutesBetweenSamePartnerCheckIn) : DEFAULT_MISSIONS_CONFIG.minMinutesBetweenSamePartnerCheckIn,
            requireProofToComplete: typeof parsed.requireProofToComplete === 'boolean' ? parsed.requireProofToComplete : DEFAULT_MISSIONS_CONFIG.requireProofToComplete,
          });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveConfig = useCallback(async (next: MissionsConfig) => {
    setConfig(next);
    try {
      await AsyncStorage.setItem(MISSIONS_CONFIG_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      if (__DEV__) console.warn('Missions config save error:', e);
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    setConfig(DEFAULT_MISSIONS_CONFIG);
    try {
      await AsyncStorage.setItem(MISSIONS_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_MISSIONS_CONFIG));
    } catch (e) {
      if (__DEV__) console.warn('Missions config reset error:', e);
    }
  }, []);

  return { config, loading, saveConfig, resetToDefaults };
}
