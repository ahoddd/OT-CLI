/**
 * OrbTap achievement badges — earned state and founding spots left.
 * Drives engagement: show spots left for Founding Member to create FOMO and sharing.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import type { BadgeId } from '../constants/Badges';
import { BADGES } from '../constants/Badges';
import { listBadgeDefinitions, evaluateUserBadges } from '../services/badgeDefinitions';
import type { BadgeDef } from '../constants/Badges';
import { RITUAL_BADGE_REGISTRY, getRitualBadge } from '../constants/RitualBadges';

const BADGES_KEY = 'ORBTAP_BADGES_V1';
const RITUAL_BADGES_KEY = 'ORBTAP_RITUAL_BADGES_V1';
const FOUNDING_STATS_KEY = 'ORBTAP_FOUNDING_STATS';

export interface FoundingStats {
  totalUsers: number;
  founding500SpotsLeft: number;
  founding2kSpotsLeft: number;
  founding10kSpotsLeft: number;
  founding100kSpotsLeft: number;
}

const DEFAULT_FOUNDING: FoundingStats = {
  totalUsers: 0,
  founding500SpotsLeft: 500,
  founding2kSpotsLeft: 2000,
  founding10kSpotsLeft: 10000,
  founding100kSpotsLeft: 100000,
};

export function useBadges() {
  const { user } = useAuth();
  const [earnedIds, setEarnedIds] = useState<BadgeId[]>([]);
  const [ritualEarnedIds, setRitualEarnedIds] = useState<string[]>([]);
  const [customBadges, setCustomBadges] = useState<BadgeDef[]>([]);
  const [foundingStats, setFoundingStats] = useState<FoundingStats>(DEFAULT_FOUNDING);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [badgesRaw, ritualRaw, statsRaw, serverBadges, customDefs] = await Promise.all([
        AsyncStorage.getItem(BADGES_KEY),
        AsyncStorage.getItem(RITUAL_BADGES_KEY),
        AsyncStorage.getItem(FOUNDING_STATS_KEY),
        user ? (async () => {
          try {
            await evaluateUserBadges().catch(() => {});
            const snap = await getDoc(doc(db, 'users', user.uid));
            const badges = snap.data()?.badges as BadgeId[] | undefined;
            return Array.isArray(badges) ? badges : null;
          } catch {
            return null;
          }
        })() : Promise.resolve(null),
        listBadgeDefinitions().catch(() => []),
      ]);
      setCustomBadges(Array.isArray(customDefs) ? customDefs : []);
      if (badgesRaw) {
        const parsed = JSON.parse(badgesRaw);
        let ids = Array.isArray(parsed) ? parsed : [];
        if (serverBadges?.length) {
          const set = new Set([...ids, ...serverBadges]);
          ids = Array.from(set);
        }
        setEarnedIds(ids);
        if (ids.length > 0) await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(ids));
      } else if (serverBadges?.length) {
        setEarnedIds(serverBadges);
        await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(serverBadges));
      }
      if (ritualRaw) {
        try {
          const parsed = JSON.parse(ritualRaw);
          setRitualEarnedIds(Array.isArray(parsed) ? parsed : []);
        } catch {
          setRitualEarnedIds([]);
        }
      }
      if (statsRaw) {
        try {
          setFoundingStats(JSON.parse(statsRaw));
        } catch {
          setFoundingStats(DEFAULT_FOUNDING);
        }
      } else {
        setFoundingStats(DEFAULT_FOUNDING);
      }
    } catch (e) {
      if (__DEV__) console.warn('Badges load failed', e);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  // Sync badges to Firestore so public profile can show achievements
  useEffect(() => {
    if (!user?.uid || loading) return;
    updateDoc(doc(db, 'users', user.uid), { badges: earnedIds }).catch(() => {});
  }, [user?.uid, loading, earnedIds]);

  const earnBadge = useCallback(async (id: BadgeId) => {
    setEarnedIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        AsyncStorage.setItem(BADGES_KEY, JSON.stringify(next)).catch(() => {});
      } catch {}
      return next;
    });
  }, []);

  const setFoundingStatsFromServer = useCallback(async (stats: FoundingStats) => {
    setFoundingStats(stats);
    try {
      await AsyncStorage.setItem(FOUNDING_STATS_KEY, JSON.stringify(stats));
    } catch {}
  }, []);

  const hasBadge = useCallback((id: BadgeId) => earnedIds.includes(id), [earnedIds]);

  const earnRitualBadge = useCallback((badgeId: string) => {
    setRitualEarnedIds((prev) => {
      if (prev.includes(badgeId)) return prev;
      const next = [...prev, badgeId];
      AsyncStorage.setItem(RITUAL_BADGES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const hasRitualBadge = useCallback((id: string) => ritualEarnedIds.includes(id), [ritualEarnedIds]);

  const allBadges = useMemo(
    () => [...BADGES, ...customBadges].sort((a, b) => a.order - b.order),
    [customBadges]
  );
  const getBadgesByCategory = useCallback(
    (category: string) => allBadges.filter((b) => b.category === category).sort((a, b) => a.order - b.order),
    [allBadges]
  );
  const earnedBadges = allBadges.filter((b) => earnedIds.includes(b.id)).sort((a, b) => a.order - b.order);
  const ritualEarnedBadges = ritualEarnedIds
    .map((id) => getRitualBadge(id))
    .filter((b): b is NonNullable<typeof b> => b != null);

  return {
    earnedIds,
    earnedBadges,
    allBadges,
    getBadgesByCategory,
    hasBadge,
    earnBadge,
    ritualEarnedIds,
    ritualEarnedBadges,
    hasRitualBadge,
    earnRitualBadge,
    foundingStats,
    setFoundingStatsFromServer,
    loading,
    refresh: load,
  };
}
