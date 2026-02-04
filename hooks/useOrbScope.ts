/**
 * OrbScope™ — Daily Vibe hook.
 * Generates today's OrbScopeDaily (deterministic), streak, and route-to-action.
 * Uses existing services: useDrops, useWallet, usePulse, useMissions, useSocial.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type OrbScopeDaily,
  type OrbScopeStreak,
  type OrbScopeActionType,
  getDateKey,
  getRandomTemplateForActionType,
  ORBSCOPE_DAILY_KEY,
  ORBSCOPE_STREAK_KEY,
} from '../constants/OrbScope';
import { useFlags } from '../components/FlagContext';
import { usePreferences } from '../hooks/usePreferences';
import { useDrops } from '../hooks/useDrops';
import { useWallet } from '../hooks/useWallet';
import { usePulse } from '../hooks/usePulse';
import { useMissions } from '../context/MissionsContext';
import { useSocial } from '../hooks/useSocial';

function areDropsLive(drops: { endAt: number }[]): boolean {
  const now = Date.now();
  return drops.some((d) => d.endAt > now);
}

/** Determine action type: FIRST_PROOF > DROP > QUEST > CIRCLE (occasionally) > PULSE */
function decideActionType(options: {
  hasVerifiedActions: boolean;
  dropsLive: boolean;
  hasQuests: boolean;
  hasCircles: boolean;
  dateKey: string;
}): OrbScopeActionType {
  const { hasVerifiedActions, dropsLive, hasQuests, hasCircles, dateKey } = options;
  if (!hasVerifiedActions) return 'FIRST_PROOF';
  if (dropsLive) return 'DROP';
  if (hasQuests) return 'QUEST';
  if (hasCircles) {
    const seed = dateKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    if (seed % 4 === 0) return 'CIRCLE';
  }
  return 'PULSE';
}

export interface UseOrbScopeResult {
  daily: OrbScopeDaily | null;
  streak: OrbScopeStreak;
  loading: boolean;
  recordView: () => void;
  refresh: () => Promise<void>;
}

export function useOrbScope(): UseOrbScopeResult {
  const { flags } = useFlags();
  const { prefs } = usePreferences();
  const { drops } = useDrops();
  const { verifiedActions } = useWallet();
  const { liveTiles } = usePulse();
  const missions = useMissions();
  const { circles } = useSocial();
  const todayMissions = missions?.todayMissions ?? [];

  const [daily, setDaily] = useState<OrbScopeDaily | null>(null);
  const [streak, setStreak] = useState<OrbScopeStreak>({
    currentStreakCount: 0,
    lastViewedDateKey: '',
    lastCompletedActionDateKey: '',
  });
  const [loading, setLoading] = useState(true);

  const dateKey = getDateKey();
  const enabled = Boolean(flags.isOrbScopeEnabled && prefs.orbScopeEnabled);

  const loadStreak = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ORBSCOPE_STREAK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OrbScopeStreak;
        setStreak({
          currentStreakCount: parsed.currentStreakCount ?? 0,
          lastViewedDateKey: parsed.lastViewedDateKey ?? '',
          lastCompletedActionDateKey: parsed.lastCompletedActionDateKey ?? '',
        });
      }
    } catch {
      setStreak((s) => s);
    }
  }, []);

  const generateAndPersistDaily = useCallback(async () => {
    const hasVerifiedActions = verifiedActions.length > 0;
    const dropsLive = areDropsLive(drops);
    const hasQuests = todayMissions.length > 0;
    const hasCircles = circles.length > 0;
    const actionType = decideActionType({
      hasVerifiedActions,
      dropsLive,
      hasQuests,
      hasCircles,
      dateKey,
    });
    const template = getRandomTemplateForActionType(actionType, dateKey);
    const dailyItem: OrbScopeDaily = {
      dateKey,
      vibeId: template.id,
      vibeText: template.vibeText,
      actionType: template.actionType,
      actionPrompt: template.actionPrompt,
      createdAt: Date.now(),
    };
    setDaily(dailyItem);
    try {
      await AsyncStorage.setItem(ORBSCOPE_DAILY_KEY, JSON.stringify(dailyItem));
    } catch {}
    return dailyItem;
  }, [dateKey, drops, verifiedActions.length, todayMissions.length, circles.length]);

  const loadOrGenerateDaily = useCallback(async () => {
    if (!enabled) {
      setDaily(null);
      setLoading(false);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(ORBSCOPE_DAILY_KEY);
      const parsed = raw ? (JSON.parse(raw) as OrbScopeDaily) : null;
      if (parsed && parsed.dateKey === dateKey) {
        setDaily(parsed);
      } else {
        await generateAndPersistDaily();
      }
    } catch {
      await generateAndPersistDaily();
    } finally {
      setLoading(false);
    }
  }, [enabled, dateKey, generateAndPersistDaily]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  useEffect(() => {
    loadOrGenerateDaily();
  }, [loadOrGenerateDaily]);

  const recordView = useCallback(() => {
    if (!flags.isOrbScopeStreakEnabled) return;
    const today = dateKey;
    setStreak((prev) => {
      let nextCount = prev.currentStreakCount;
      if (prev.lastViewedDateKey !== today) {
        const yesterday = getDateKey(new Date(Date.now() - 86400000).getTime());
        if (prev.lastViewedDateKey === yesterday) {
          nextCount += 1;
        } else if (prev.lastViewedDateKey !== today) {
          nextCount = 1;
        }
      }
      const next: OrbScopeStreak = {
        currentStreakCount: nextCount,
        lastViewedDateKey: today,
        lastCompletedActionDateKey: prev.lastCompletedActionDateKey,
      };
      AsyncStorage.setItem(ORBSCOPE_STREAK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [dateKey, flags.isOrbScopeStreakEnabled]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadOrGenerateDaily();
    await loadStreak();
    setLoading(false);
  }, [loadOrGenerateDaily, loadStreak]);

  return { daily, streak, loading, recordView, refresh };
}

/** Get route for OrbScope action type (call from component with useRouter). */
export function getOrbScopeActionRoute(actionType: OrbScopeDaily['actionType']): string {
  switch (actionType) {
    case 'DROP':
      return '/pulse';
    case 'QUEST':
      return '/missions';
    case 'PULSE':
      return '/pulse';
    case 'CIRCLE':
      return '/spheres';
    case 'FIRST_PROOF':
      return '/(tabs)/scan';
    default:
      return '/pulse';
  }
}
